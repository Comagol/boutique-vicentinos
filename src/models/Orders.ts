import { db } from '../config/firebase';
import { Order, OrderStatus } from '../types/Order';

const COLLECTION_NAME = 'orders';

//convertir Firestore a Order
const firestoreToOrder = (data: any, id: string): Order => ({
  id,
  orderNumber: data.orderNumber,
  customer: data.customer,
  items: data.items,
  status: data.status,
  total: data.total,
  paymentMethod: data.paymentMethod,
  paymentId: data.paymentId,
  createdAt: data.createdAt?.toDate() || new Date(),
  updatedAt: data.updatedAt?.toDate() || new Date(),
  expiresAt: data.expiresAt?.toDate(),
});