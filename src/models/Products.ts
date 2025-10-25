// src/models/Products.ts

import { db } from '../config/firebase';
import { Product, ProductCategory } from '../types/Product';

const COLLECTION_NAME = 'products';

// Convierto Firestore Timestamp a date
const firestoreToProduct = (data: any, id: string): Product => ({
  id,
  name: data.name,
  description: data.description,
  category: data.category,
  baseColor: data.baseColor,
  tags: data.tags,
  price: data.price,
  discountPrice: data.discountPrice,
  images: data.images,
  sizes: data.sizes,
  colors: data.colors,
  stock: data.stock,
  isActive: data.isActive,
  createdAt: data.createdAt?.toDate() || new Date(),
  updatedAt: data.updatedAt?.toDate() || new Date(),
});

// Convierto Product a formato Firestore
const productToFirestore = (product: Partial<Product>): any => {
  const { id, ...data } = product;
  return data;
};

export const ProductModel = {
  // CREAR producto
  async create(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    try {
      const docRef = await db.collection(COLLECTION_NAME).add({
        ...productData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const doc = await docRef.get();
      return firestoreToProduct(doc.data()!, doc.id);
    } catch (error) {
      throw new Error(`Error creating product: ${error}`);
    }
  },

  // OBTENER por ID
  async getById(id: string): Promise<Product | null> {
    try {
      const doc = await db.collection(COLLECTION_NAME).doc(id).get();
      if (!doc.exists) return null;
      return firestoreToProduct(doc.data()!, doc.id);
    } catch (error) {
      throw new Error(`Error getting product by ID: ${error}`);
    }
  },

  // LISTAR todos (con filtros opcionales)
  async getAll(filters?: {isActive?:boolean, category?:ProductCategory}): Promise<Product[]> {
    try {
      let query: FirebaseFirestore.Query = db.collection(COLLECTION_NAME);

      if (filters?.isActive !== undefined) {
        query = query.where('isActive', '==', filters.isActive);
      }

      if (filters?.category) {
        query = query.where('category', '==', filters.category);
      }

      const snapshot = await query.get();
      return snapshot.docs.map((doc) => firestoreToProduct(doc.data(), doc.id));
    } catch (error) {
      throw new Error(`Error getting products: ${error}`);
    }
  },

  // ACTUALIZAR
  async update(id: string, updates: Partial<Product>): Promise<Product> {
    try {
      await db.collection(COLLECTION_NAME).doc(id).update(productToFirestore(updates));
      return (await this.getById(id))!;
    } catch (error) {
      throw new Error(`Error updating product: ${error}`);
    }
  },

  // ELIMINAR físicamente (sin lógica de negocio)
  async delete(id: string): Promise<void> {
    try {
      await db.collection(COLLECTION_NAME).doc(id).delete();
    } catch (error) {
      throw new Error(`Error deleting product: ${error}`);
    }
  },
};