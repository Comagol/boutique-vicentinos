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

export const OrderModel = {
  // CREAR orden
  async create(orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<Order> {
    try {
      const docRef = await db.collection(COLLECTION_NAME).add({
        ...orderData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const doc = await docRef.get();
      return firestoreToOrder(doc.data()!, doc.id);
    } catch (error) {
      throw new Error(`Error creating order: ${error}`);
    }
  },

  //Obtener orden por ID
  async getById(id: string): Promise<Order | null> {
    try {
      const doc = await db.collection(COLLECTION_NAME).doc(id).get();
      if (!doc.exists) return null;
      return firestoreToOrder(doc.data()!, doc.id);
    } catch (error) {
      throw new Error(`Error getting order by ID: ${error}`);
    }
  }
}