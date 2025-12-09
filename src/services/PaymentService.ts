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
  if (!url) {
    throw new Error('FRONTEND_URL is not set in environment variables');
  }
  return url;
};

const getApiUrl = (): string => {
  const url = process.env.API_URL;
  if (!url) {
    throw new Error('API_URL is not set in environment variables');
  }
  return url;
};

// Detectar modo test/producción basado en el access token
const isTestMode = (): boolean => {
  const token = getAccessToken();
  // Los tokens de test suelen empezar con "TEST-" o contener "test"
  return token.includes('TEST') || token.toLowerCase().includes('test');
};

// Configurar cliente Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: getAccessToken(),
  options: {
    timeout: 10000, // Aumentado a 10 segundos para mejor confiabilidad
  },
});

// Crear instancias de los recursos
const preference = new Preference(client);
const paymentClient = new Payment(client);

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

      // Crear la preferencia de pago
      const preferenceData = {
        items,
        external_reference: order.id,
        back_urls: {
          success: `${getFrontendUrl()}/order/${order.id}?status=success`,
          failure: `${getFrontendUrl()}/order/${order.id}?status=failure`,
          pending: `${getFrontendUrl()}/order/${order.id}?status=pending`,
        },
        auto_return: 'approved' as const,
        notification_url: `${getApiUrl()}/api/payments/webhook`,
        statement_descriptor: 'BOUTIQUE VICENTINOS', // Aparece en el resumen de tarjeta
        expires: true,
        expiration_date_from: new Date().toISOString(),
        expiration_date_to: order.expiresAt 
          ? new Date(order.expiresAt).toISOString() 
          : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 días por defecto
      };

      // Crear la preferencia en Mercado Pago
      const response = await preference.create({ body: preferenceData });

      if (!response.init_point) {
        throw new Error('Mercado Pago did not return a payment URL');
      }

      return {
        paymentUrl: response.init_point,
        preferenceId: response.id || '',
      };
    } catch (error: any) {
      // Mejorar mensaje de error
      if (error.response?.data) {
        throw new Error(
          `Failed to create payment preference: ${JSON.stringify(error.response.data)}`
        );
      }
      throw new Error(`Failed to create payment preference: ${error.message}`);
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

      const paymentData = await paymentClient.get({ id: paymentId });
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