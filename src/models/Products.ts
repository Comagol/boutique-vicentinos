import { db } from '../config/firebase';
import { Product, ProductCategory } from '../types/Product';
import { legacyStockToVariants, normalizeAndValidateVariants } from '../utils/productVariants';

const COLLECTION_NAME = 'products';

// Función auxiliar para asegurar que un valor sea un array
const ensureArray = <T>(value: any, defaultValue: T[] = []): T[] => {
  if (Array.isArray(value)) {
    return value;
  }
  // Si es string, intentar parsearlo como JSON
  if (typeof value === 'string' && value.trim() !== '') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : defaultValue;
    } catch {
      return defaultValue;
    }
  }
  return defaultValue;
};

// Función auxiliar para asegurar que isActive sea boolean
const ensureBoolean = (value: any, defaultValue: boolean = true): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true' || value === '1';
  }
  return defaultValue;
};

// Convierto Firestore Timestamp a date
const resolveVariantsFromFirestore = (data: any) => {
  try {
    const rawVariants = ensureArray<any>(data.variants, []);
    if (rawVariants.length > 0) {
      return normalizeAndValidateVariants(rawVariants);
    }

    const rawStock = ensureArray<any>(data.stock, []);
    if (rawStock.length > 0) {
      return legacyStockToVariants({
        stock: rawStock,
        colors: ensureArray<string>(data.colors, []),
        baseColor: data.baseColor,
      });
    }

    return normalizeAndValidateVariants([], { allowEmpty: true });
  } catch {
    // Mantener lectura resiliente para productos legacy corruptos
    return normalizeAndValidateVariants([], { allowEmpty: true });
  }
};

const firestoreToProduct = (data: any, id: string): Product => ({
  id,
  name: data.name || '',
  description: data.description || '',
  category: data.category,
  baseColor: data.baseColor,
  // Asegurar que los arrays sean arrays, no strings
  tags: ensureArray<string>(data.tags, []),
  price: typeof data.price === 'number' ? data.price : parseFloat(data.price) || 0,
  discountPrice: data.discountPrice 
    ? (typeof data.discountPrice === 'number' ? data.discountPrice : parseFloat(data.discountPrice))
    : undefined,
  images: ensureArray<string>(data.images, []),
  variants: resolveVariantsFromFirestore(data),
  isActive: ensureBoolean(data.isActive, true),
  createdAt: data.createdAt?.toDate() || new Date(),
  updatedAt: data.updatedAt?.toDate() || new Date(),
});

// Convierto Product a formato Firestore
const productToFirestore = (product: Partial<Product>): any => {
  const { id, ...data } = product;
  
  // Asegurar que los arrays sean arrays antes de guardar
  const firestoreData: any = { ...data };
  
  // Validar y convertir arrays
  if (firestoreData.tags !== undefined) {
    firestoreData.tags = ensureArray<string>(firestoreData.tags, []);
  }
  if (firestoreData.images !== undefined) {
    firestoreData.images = ensureArray<string>(firestoreData.images, []);
  }
  if (firestoreData.variants !== undefined) {
    firestoreData.variants = normalizeAndValidateVariants(firestoreData.variants);
  }
  
  // Asegurar que isActive sea boolean
  if (firestoreData.isActive !== undefined) {
    firestoreData.isActive = ensureBoolean(firestoreData.isActive, true);
  }
  
  return firestoreData;
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

export default ProductModel;