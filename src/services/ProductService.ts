//importo los modelos y tipos
import { ProductModel } from '../models/Products';
import { Product, ProductCategory } from '../types/Product';

//Servicios para Productos
export const ProductService = {
  //CREAR producto
  async createProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    if (!productData.name || productData.name.trim() === '') {
      throw new Error('Name is required');
    }
    if (!productData.description || productData.description.trim() === '') {
      throw new Error('Description is required');
    }
    if (!productData.category) {
      throw new Error('Category is required');
    }
    if (!productData.price || productData.price <= 0) {
      throw new Error('Price must be greater than 0');
    }

    //valores por defecto
    const newProduct = {
      ...productData,
      tags: productData.tags || [],
      images: productData.images || [],
      sizes: productData.sizes || [],
      colors: productData.colors || [],
      stock: productData.stock || [],
      isActive: productData.isActive ?? true,
      description: productData.description || '',
    };
    
    // Si hay descuento, validar que sea menor al precio original
    if (productData.discountPrice) {
      if (productData.discountPrice >= productData.price) {
        throw new Error('Discount price must be less than the original price');
      }
      if (productData.discountPrice <= 0) {
        throw new Error('Discount price must be greater than 0');
      }
    }

    // Generar tags automáticamente desde la categoría (esto es un ejemplo, puede ser más complejo)
    const tags = generateTagsFromCategory(newProduct.category);
    newProduct.tags = tags;

    // Crear el producto
    return await ProductModel.create(newProduct);
  },

  //obtener un producto por id
  async getProductById(id: string): Promise<Product> {
    const product = await ProductModel.getById(id);
    if(!product) {
      throw new Error('Product not found');
    }
    return product;
  },

  //obtener todos los productos activos
  async getAllActiveProducts(category?: ProductCategory): Promise<Product[]> {
    const filters: { isActive: boolean; category?: ProductCategory } = {
      isActive: true
    };
    if (category) {
      filters.category = category;
    }
    return await ProductModel.getAll(filters);
  },

  async getAllProducts(category?: ProductCategory): Promise<Product[]> {
    const filters: { category?: ProductCategory } = {};
    if (category) {
      filters.category = category;
    }
    return await ProductModel.getAll(filters);
  },

  
  // Actualizar producto
  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    // Verificar que el producto existe
    await this.getProductById(id);

    // Validaciones
    if (updates.name !== undefined && updates.name.trim() === '') {
      throw new Error('Name cannot be empty');
    }

    if (updates.price !== undefined && updates.price <= 0) {
      throw new Error('Price must be greater than 0');
    }

    // Validar descuento
    if (updates.discountPrice !== undefined) {
      const currentProduct = await ProductModel.getById(id);
      const price = updates.price || currentProduct!.price;
      
      if (updates.discountPrice >= price) {
        throw new Error('Discount price must be less than the original price');
      }
      if (updates.discountPrice <= 0) {
        throw new Error('Discount price must be greater than 0');
      }
    }

    // Si cambia la categoría, regenerar tags
    if (updates.category) {
      updates.tags = this.generateTagsFromCategory(updates.category);
    }

    // Actualizar
    return await ProductModel.update(id, {
      ...updates,
      updatedAt: new Date(),
    });
  },

  

}