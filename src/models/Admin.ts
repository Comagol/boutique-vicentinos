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