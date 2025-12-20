import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import { Order } from '../types/Order';

// Validar variables de entorno al inicio
const getAccessToken = (): string => {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) {
    throw new Error('MERCADOPAGO_ACCESS_TOKEN is not set in environment variables');
  }
  return token;
};

const getFrontendUrl = (): string => {
  const url = process.env.FRONTEND_URL;
  if (!url || url.trim() === '') {
    throw new Error('FRONTEND_URL is not set in environment variables');
  }
  // Asegurar que la URL no termine con /
  return url.trim().replace(/\/$/, '');
};

const getApiUrl = (): string => {
  const url = process.env.API_URL;
  if (!url || url.trim() === '') {
    throw new Error('API_URL is not set in environment variables');
  }
  // Asegurar que la URL no termine con /
  return url.trim().replace(/\/$/, '');
};

// Detectar modo test/producción basado en el access token
const isTestMode = (): boolean => {
  const token = getAccessToken();
  // Los tokens de test suelen empezar con "TEST-" o contener "test"
  return token.includes('TEST') || token.toLowerCase().includes('test');
};

// Inicialización lazy del cliente de Mercado Pago
let client: MercadoPagoConfig | null = null;
let preference: Preference | null = null;
let paymentClient: Payment | null = null;

const getClient = (): MercadoPagoConfig => {
  if (!client) {
    client = new MercadoPagoConfig({
      accessToken: getAccessToken(),
      options: {
        timeout: 10000, // Aumentado a 10 segundos para mejor confiabilidad
      },
    });
  }
  return client;
};

const getPreference = (): Preference => {
  if (!preference) {
    preference = new Preference(getClient());
  }
  return preference;
};

const getPaymentClient = (): Payment => {
  if (!paymentClient) {
    paymentClient = new Payment(getClient());
  }
  return paymentClient;
};

export const PaymentService = {
  /**
   * Crea una preferencia de pago en Mercado Pago
   * @param order - Orden a pagar
   * @returns URL de pago (init_point)
   */
  async createPaymentPreference(order: Order): Promise<{ paymentUrl: string; preferenceId: string }> {
    try {
      // Validar que la orden tenga items
      if (!order.items || order.items.length === 0) {
        throw new Error('Order must have at least one item');
      }

      // Validar que el total sea mayor a 0
      if (!order.total || order.total <= 0) {
        throw new Error('Order total must be greater than 0');
      }

      // Mapear items de la orden a formato de Mercado Pago
      const items = order.items.map((item, index) => {
        // Validar cada item
        if (!item.productId || !item.productName) {
          throw new Error(`Item at index ${index} is missing productId or productName`);
        }
        if (!item.quantity || item.quantity <= 0) {
          throw new Error(`Item at index ${index} must have quantity greater than 0`);
        }
        if (!item.price || item.price <= 0) {
          throw new Error(`Item at index ${index} must have price greater than 0`);
        }

        return {
          id: item.productId,
          title: item.productName.substring(0, 127), // Límite de Mercado Pago: 127 caracteres
          description: `${item.size || 'N/A'} - ${item.color || 'N/A'}`.substring(0, 127),
          quantity: item.quantity,
          unit_price: Number(item.price.toFixed(2)), // Asegurar 2 decimales
        };
      });

      // Calcular total de items para validar
      const calculatedTotal = items.reduce((sum, item) => {
        return sum + (item.unit_price * item.quantity);
      }, 0);

      // Validar que el total calculado coincida con el total de la orden (con tolerancia de 0.01)
      const totalDifference = Math.abs(calculatedTotal - order.total);
      if (totalDifference > 0.01) {
        throw new Error(
          `Order total mismatch: calculated ${calculatedTotal.toFixed(2)}, order total ${order.total.toFixed(2)}`
        );
      }

      // Obtener URLs y validarlas
      const frontendUrl = getFrontendUrl();
      const apiUrl = getApiUrl();
      
      // Validar que las URLs sean válidas
      if (!frontendUrl || frontendUrl.trim() === '') {
        throw new Error('FRONTEND_URL is empty or invalid');
      }
      
      if (!apiUrl || apiUrl.trim() === '') {
        throw new Error('API_URL is empty or invalid');
      }

      // Validar que las URLs tengan protocolo válido
      const isValidUrl = (url: string): boolean => {
        try {
          const urlObj = new URL(url);
          return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
        } catch {
          return false;
        }
      };

      if (!isValidUrl(frontendUrl)) {
        throw new Error(`FRONTEND_URL is not a valid URL: ${frontendUrl}`);
      }

      if (!isValidUrl(apiUrl)) {
        throw new Error(`API_URL is not a valid URL: ${apiUrl}`);
      }

      // Construir URLs de retorno (asegurar que no haya doble slash)
      const baseFrontendUrl = frontendUrl.replace(/\/$/, '');
      const baseApiUrl = apiUrl.replace(/\/$/, '');
      
      // Las URLs de retorno apuntan al backend para procesar el pago antes de redirigir al frontend
      // Esto asegura que el estado se actualice inmediatamente, especialmente importante en modo test
      const successUrl = `${baseApiUrl}/api/payments/return`;
      const failureUrl = `${baseApiUrl}/api/payments/return`;
      const pendingUrl = `${baseApiUrl}/api/payments/return`;
      const webhookUrl = `${baseApiUrl}/api/payments/webhook`;

      // Validar que todas las URLs estén definidas y sean válidas
      if (!successUrl || !failureUrl || !pendingUrl || !webhookUrl) {
        throw new Error('One or more URLs are undefined');
      }

      if (!isValidUrl(successUrl) || !isValidUrl(failureUrl) || !isValidUrl(pendingUrl) || !isValidUrl(webhookUrl)) {
        throw new Error(`Invalid URLs - success: ${successUrl}, failure: ${failureUrl}, pending: ${pendingUrl}, webhook: ${webhookUrl}`);
      }

      // Asegurar que todas las URLs sean strings válidos
      const backUrls = {
        success: String(successUrl).trim(),
        failure: String(failureUrl).trim(),
        pending: String(pendingUrl).trim(),
      };

      // Validar que todas las URLs estén definidas y sean válidas
      if (!backUrls.success || !backUrls.failure || !backUrls.pending) {
        throw new Error(
          `Invalid back_urls - success: ${backUrls.success}, ` +
          `failure: ${backUrls.failure}, ` +
          `pending: ${backUrls.pending}`
        );
      }

      // Crear la preferencia de pago con estructura explícita
      // Nota: Mercado Pago SDK v2 puede tener problemas con auto_return y back_urls
      // Vamos a construir el objeto de manera más explícita
      const preferenceData: any = {
        items: items.map(item => ({
          id: String(item.id),
          title: String(item.title),
          description: String(item.description),
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price),
        })),
        external_reference: String(order.id),
        back_urls: {
          success: String(backUrls.success),
          failure: String(backUrls.failure),
          pending: String(backUrls.pending),
        },
        notification_url: String(webhookUrl).trim(),
        statement_descriptor: 'BOUTIQUE VICENTINOS',
        expires: true,
        expiration_date_from: new Date().toISOString(),
        expiration_date_to: order.expiresAt 
          ? new Date(order.expiresAt).toISOString() 
          : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      };

      // Agregar información del payer si está disponible
      // Esto ayuda a evitar la validación de email en usuarios de test
      // Nota: Si aún se requiere validación de email con usuarios de test,
      // usar los últimos 6 dígitos del User ID o Access Token como código de verificación
      if (order.customer && order.customer.email) {
        preferenceData.payer = {
          email: order.customer.email,
          name: order.customer.name || undefined,
          phone: order.customer.phone ? {
            area_code: order.customer.phone.replace(/\D/g, '').substring(0, 2) || undefined,
            number: order.customer.phone.replace(/\D/g, '').substring(2) || undefined,
          } : undefined,
        };
      }

      // Intentar sin auto_return primero para ver si ese es el problema
      // Si funciona, luego podemos agregarlo de vuelta
      // preferenceData.auto_return = 'approved';

      // Crear la preferencia en Mercado Pago
      const response = await getPreference().create({ body: preferenceData });

      if (!response.init_point) {
        throw new Error('Mercado Pago did not return a payment URL');
      }

      return {
        paymentUrl: response.init_point,
        preferenceId: response.id || '',
      };
    } catch (error: any) {
      
      // Mejorar mensaje de error con más detalles
      let errorMessage = 'Failed to create payment preference';
      
      if (error.response?.data) {
        const errorData = error.response.data;
        // Mercado Pago puede devolver errores en diferentes formatos
        if (errorData.message) {
          errorMessage = `Failed to create payment preference: ${errorData.message}`;
        } else if (errorData.cause && Array.isArray(errorData.cause)) {
          // Errores de validación de Mercado Pago
          const validationErrors = errorData.cause.map((err: any) => 
            `${err.code || ''} ${err.message || ''}`.trim()
          ).join(', ');
          errorMessage = `Failed to create payment preference: ${validationErrors || JSON.stringify(errorData)}`;
        } else {
          errorMessage = `Failed to create payment preference: ${JSON.stringify(errorData)}`;
        }
      } else if (error.message) {
        errorMessage = `Failed to create payment preference: ${error.message}`;
      }
      
      throw new Error(errorMessage);
    }
  },

  /**
   * Verifica y obtiene información de un pago en Mercado Pago
   * @param paymentId - ID del pago en Mercado Pago
   * @returns Información completa del pago
   */
  async verifyPayment(paymentId: string): Promise<any> {
    try {
      if (!paymentId) {
        throw new Error('Payment ID is required');
      }

      const paymentData = await getPaymentClient().get({ id: paymentId });
      return paymentData;
    } catch (error: any) {
      if (error.response?.data) {
        throw new Error(
          `Failed to verify payment: ${JSON.stringify(error.response.data)}`
        );
      }
      throw new Error(`Failed to verify payment: ${error.message}`);
    }
  },

  /**
   * Obtiene información completa de un pago incluyendo estado y detalles
   * @param paymentId - ID del pago en Mercado Pago
   * @returns Información estructurada del pago
   */
  async getPaymentInfo(paymentId: string): Promise<{
    id: string;
    status: string;
    statusDetail: string;
    externalReference: string;
    transactionAmount: number;
    dateCreated: string;
    dateApproved?: string;
  }> {
    try {
      const paymentData = await this.verifyPayment(paymentId);
      
      // Normalizar respuesta según estructura de Mercado Pago SDK v2
      const body = paymentData.body || paymentData;
      
      return {
        id: body.id?.toString() || paymentId,
        status: body.status || 'unknown',
        statusDetail: body.status_detail || '',
        externalReference: body.external_reference || '',
        transactionAmount: body.transaction_amount || 0,
        dateCreated: body.date_created || new Date().toISOString(),
        dateApproved: body.date_approved,
      };
    } catch (error: any) {
      throw new Error(`Failed to get payment info: ${error.message}`);
    }
  },

  /**
   * Verifica si estamos en modo test
   * @returns true si está en modo test, false si es producción
   */
  isTestMode(): boolean {
    return isTestMode();
  },
};