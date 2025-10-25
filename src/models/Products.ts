import { db } from '../config/firebase';
import { Product, ProductCategory } from '../types/Product';

//nombre de la coleccion en firebase
const COLLECTION_NAME = 'products';

// Convierto Firestore Timestamp a date
const firestoreToProduct = (data: any, id: string): Product => ({
  id,
  name: data.name,
  description: data.description,
  category: data.category,
  baseColor: data.baseColor,
  tags: data.tags || [],
  price: data.price,
  discountPrice: data.discountPrice,
  images: data.images || [],
  sizes: data.sizes,
  colors: data.colors || [],
  stock: data.stock || [],
  isActive: data.isActive ?? true,
  createdAt: data.createdAt?.toDate() || new Date(),
  updatedAt: data.updatedAt?.toDate() || new Date(),
});