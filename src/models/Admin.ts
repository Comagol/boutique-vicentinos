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
  }
}