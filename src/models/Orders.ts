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

//convertir Order a formato Firestore
const orderToFirestore = (order: Partial<Order>): any => {
  const { id, ...data } = order;
  return {
    ...data,
    updatedAt: new Date(),
  };
};

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

  //Actualizar una orden
  async update(id: string, updates: Partial<Order>): Promise<Order> {
    try {
      await db.collection(COLLECTION_NAME).doc(id).update(orderToFirestore(updates));
      return (await this.getById(id))!;
    } catch (error) {
      throw new Error(`Error updating order: ${error}`);
    }
  },

  // ACTUALIZAR estado específico
  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    try {
      await db.collection(COLLECTION_NAME).doc(id).update({
        status,
        updatedAt: new Date(),
      });
      return (await this.getById(id))!;
    } catch (error) {
      throw new Error(`Error updating order status: ${error}`);
    }
  },

  // CONFIRMAR PAGO
  async confirmPayment(id: string, paymentId: string): Promise<Order> {
    try {
      await db.collection(COLLECTION_NAME).doc(id).update({
        status: 'payment-confirmed',
        paymentId,
        updatedAt: new Date(),
      });
      return (await this.getById(id))!;
    } catch (error) {
      throw new Error(`Error confirming payment: ${error}`);
    }
  },

  // CANCELAR ORDEN
  async cancel(id: string, reason: 'manually-cancelled' | 'cancelled-by-time'): Promise<Order> {
    try {
      await db.collection(COLLECTION_NAME).doc(id).update({
        status: reason,
        updatedAt: new Date(),
      });
      return (await this.getById(id))!;
    } catch (error) {
      throw new Error(`Error cancelling order: ${error}`);
    }
  },

  // MARCAR COMO ENTREGADO
  async markAsDelivered(id: string): Promise<Order> {
    try {
      await db.collection(COLLECTION_NAME).doc(id).update({
        status: 'delivered',
        updatedAt: new Date(),
      });
      return (await this.getById(id))!;
    } catch (error) {
      throw new Error(`Error marking order as delivered: ${error}`);
    }
  },
};