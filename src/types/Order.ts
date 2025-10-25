export type OrderStatus =
| 'pending-payment'
| 'payment-confirmed'
| 'manually-cancelled'
| 'cancelled-by-time'
| 'delivered';

export interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
}

