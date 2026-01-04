// Modelo Customer

import { db } from '../config/firebase';
import { CustomerUser } from '../types/User';

const COLLECTION_NAME = 'customers';

const firestoreToCustomer = (data: any, id: string): CustomerUser => ({
  id,
  email:data.email,
  name:data.name,
  passwordHash:data.passwordHash,
  role:data.role,
  createdAt:data.createdAt?.toDate() || new Date(),
  updatedAt:data.updatedAt?.toDate() || new Date(),
  lastLoginAt:data.lastLoginAt?.toDate(),
  isActive:data.isActive,
});

//convertir CustomerUser a formato Firestore
const customerToFireStore = (customer: Partial<CustomerUser>): any => {
  const { id, ...data } = customer;
  return data;
};

export const CustomerModel = {
  //CREAR CUSTOMER
  async create(customerData: Omit<CustomerUser, 'id' | 'createdAt' | 'updatedAt'>): Promise<CustomerUser> {
    try {
      const docRef = await db.collection(COLLECTION_NAME).add({
        ...customerData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const doc = await docRef.get();
      return firestoreToCustomer(doc.data()!, doc.id);
    } catch (error) {
      throw new Error(`Error creating customer: ${error}`);
    }
  },

  //OBTENER CUSTOMER POR ID
  async getById(id: string): Promise<CustomerUser | null> {
    try {
      const doc = await db.collection(COLLECTION_NAME).doc(id).get();
      if(!doc.exists) return null;
      return firestoreToCustomer(doc.data()!, doc.id);
    } catch (error) {
      throw new Error(`Error getting customer by ID: ${error}`);
    }
  },

  //OBTENER CUSTOMER POR EMAIL
  async getByEmail(email:string): Promise<CustomerUser | null> {
    try {
      const snapshot = await db.collection(COLLECTION_NAME)
      .where('email', '==', email)
      .limit(1)
      .get();

      if (snapshot.empty) return null;
      const doc = snapshot.docs[0]!;
      return firestoreToCustomer(doc.data()!, doc.id);
    } catch (error) {
      throw new Error(`Error getting customer by email: ${error}`);
    }
  },

  //actualizar customer
  async update(id: string, updates: Partial<CustomerUser>): Promise<CustomerUser> {
    try {
      await db.collection(COLLECTION_NAME).doc(id).update(customerToFireStore(updates));
      return (await this.getById(id))!;
    } catch (error) {
      throw new Error(`Error updating customer: ${error}`);
    }
  },

  //eliminar customer
  async delete(id: string): Promise<void> {
    try {
      await db.collection(COLLECTION_NAME).doc(id).delete();
    } catch (error) {
      throw new Error(`Error deleting customer: ${error}`);
    }
  }
};