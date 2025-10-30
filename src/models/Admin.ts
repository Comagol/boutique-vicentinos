// Modelo Admin

import { db } from '../config/firebase';
import { AdminUser } from '../types/User';

const COLLECTION_NAME = 'admins';

const firestoreToAdmin = (data: any, id: string): AdminUser => ({
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

//convertir AdminUser a formato Firestore
const adminToFireStore = (admin: Partial<AdminUser>): any => {
  const { id, ...data } = admin;
  return data;
};

export const AdminModel = {
  //CREAR ADMIN
  async create(adminData: Omit<AdminUser, 'id' | 'createdAt' | 'updatedAt'>): Promise<AdminUser> {
    try {
      const docRef = await db.collection(COLLECTION_NAME).add({
        ...adminData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const doc = await docRef.get();
      return firestoreToAdmin(doc.data()!, doc.id);
    } catch (error) {
      throw new Error(`Error creating admin: ${error}`);
    }
  },

  //OBTENER ADMIN POR ID
  async getById(id: string): Promise<AdminUser | null> {
    try {
      const doc = await db.collection(COLLECTION_NAME).doc(id).get();
      if(!doc.exists) return null;
      return firestoreToAdmin(doc.data()!, doc.id);
    } catch (error) {
      throw new Error(`Error getting admin by ID: ${error}`);
    }
  },

  //OBTENER ADMIN POR EMAIL
  async getByEmail(email:string): Promise<AdminUser | null> {
    try {
      const snapshot = await db.collection(COLLECTION_NAME)
      .where('email', '==', email)
      .limit(1)
      .get();

      if (snapshot.empty) return null;
      const doc = snapshot.docs[0]!;
      return firestoreToAdmin(doc.data()!, doc.id);
    } catch (error) {
      throw new Error(`Error getting admin by email: ${error}`);
    }
  },
}