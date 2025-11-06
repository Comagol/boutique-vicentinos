import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import { Order } from '../types/Order';

//configurar cliente mercado pago
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
  options: {
    timeout: 5000,
  },
});

//Creo las instancias de los recursos
const preference = new Preference(client);
const paymentClient = new Payment(client);

export const PaymentService = {
  // creo preferencia de pago
  async createPaymentPreference(order: Order): Promise<string> {
    try {
      const items = order.items.map(item=> ({
        id: item.productId,
        title: item.productName,
        description: `${item.size} - ${item.color}`,
        quantity: item.quantity,
        unit_price: item.price,
      }));

      //creo la preferencia de pago
      const preferenceData = {
        items,
        external_reference: order.id,
        back_urls: {
          success: `${process.env.FRONTEND_URL}/order/${order.id}?status=success`,
          failure: `${process.env.FRONTEND_URL}/order/${order.id}?status=failure`,
          pending: `${process.env.FRONTEND_URL}/order/${order.id}?status=pending`,
        },
        auto_return: 'approved',
        notification_url: `${process.env.API_URL}/api/payments/webhook`,
      };

      //creo la preferencia de pago
      const response = await preference.create({ body: preferenceData });

      return response.init_point || '';
    } catch (error: any) {
      throw new Error(`Failed to create payment preference: ${error.message}`);
    }
  },

  // verifico notificaciones de mercado pago
  async verifyPayment(notificationId: string): Promise<any> {
    try {
      const paymentData = await paymentClient.get({ id: notificationId });
      return paymentData;
    } catch (error: any) {
      throw new Error(`Failed to verify payment: ${error.message}`);
    }
  }
}