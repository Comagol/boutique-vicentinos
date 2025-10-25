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

export interface Order {
  id: string;
  orderNumber: string;
  customer: CustomerInfo;
  items: OrderItem[];
  status: OrderStatus;
  total: number;
  paymentMethod: string;
  paymentId?: string;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
}