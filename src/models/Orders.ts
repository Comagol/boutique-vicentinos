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
  },

  //Obtener por numero de orden
  async getByOrderNumber(orderNumber: string): Promise<Order | null> {
    try {
      const snapshot = await db.collection(COLLECTION_NAME)
        .where('orderNumber', '==', orderNumber)
        .limit(1)
        .get();
      
      if (snapshot.empty) return null;
      const doc = snapshot.docs[0]!;
      return firestoreToOrder(doc.data(), doc.id);
    } catch (error) {
      throw new Error(`Error getting order by number: ${error}`);
    }
  },

  //listar todas las ordenes con filtros opcionales
  async getAll(filters?: {status?: OrderStatus; customerEmail?: string; customerName?: string}): Promise<Order[]> {
    try {
      let query: FirebaseFirestore.Query = db.collection(COLLECTION_NAME);

      if (filters?.status) {
        query = query.where('status', '==', filters.status);
      }

      if (filters?.customerEmail) {
        query = query.where('customer.email', '==', filters.customerEmail);
      }

      if (filters?.customerName) {
        query = query.where('customer.name', '==', filters.customerName);
      }

      const snapshot = await query.orderBy('createdAt', 'desc').get();
      return snapshot.docs.map((doc) => firestoreToOrder(doc.data(), doc.id));
    } catch (error) {
      throw new Error(`Error getting orders: ${error}`);
    }
  },

  
}