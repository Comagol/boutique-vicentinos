import mercadopago from 'mercadopago';
import { Order } from '../types/Order';

//configurar mercado pago
mercadopago.configure({
  access_token: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
});

export const PaymentService = {
  // creo preferencia de pago
  async createPaymentPreference(order: Order): Promise<string> {
    try {
      const items = order.items.map(item=> ({
        title: item.productName,
        description: `${item.size} - ${item.color}`,
        quantity: item.quantity,
        unit_price: item.price,
      }));

      //creo la preferencia de pago
      const preference = {
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
      const response = await mercadopago.preferences.create(preference);

      return response.body.init_point;
    } catch (error: any) {
      throw new Error(`Failed to create payment preference: ${error.message}`);
    }
  },

  // verifico notificaciones de mercado pago
  async verifyPayment(notificationId: string): Promise<any> {
    try {
      const payment = await mercadopago.payment.findById(notificationId);
      return payment;
    } catch (error: any) {
      throw new Error(`Failed to verify payment: ${error.message}`);
    }
  }
}