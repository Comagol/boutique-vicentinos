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

export interface OrderItem {
  productId: string;
  productName: string;
  size: string;
  color: string;
  quantity: number;
  price: number; //precio al momento de la compra
  reservedStock: boolean;
}

export type PaymentStatus = 
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'cancelled';

export interface Order {
  id: string;
  orderNumber: string;
  customer: CustomerInfo;
  customerId?: string; // ID del cliente en la base de datos
  items: OrderItem[];
  status: OrderStatus;
  total: number;
  paymentMethod: string;
  paymentId?: string; // ID del pago en Mercado Pago
  preferenceId?: string; // ID de la preferencia de Mercado Pago
  paymentStatus?: PaymentStatus; // Estado del pago en Mercado Pago
  paymentDate?: Date; // Fecha en que se procesó el pago
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
}