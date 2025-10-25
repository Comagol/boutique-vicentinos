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

// Convierto Product a formato Firestore
const productToFirestore = (product: Partial<Product>): any => {
  const { id, ...data } = product;
  return {
    ...data,
    updatedAt: new Date(),
  };
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

  //Obtener producto por ID
  async getById(id: string): Promise<Product | null> {
    try {
      const doc = await db.collection(COLLECTION_NAME).doc(id).get();
      if (!doc.exists) return null;
      return firestoreToProduct(doc.data()!, doc.id);
    } catch (error) {
      throw new Error(`Error getting product by ID: ${error}`);
    }
  },
}