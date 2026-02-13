//importo los modelos y tipos
import { ProductModel } from '../models/Products';
import { Product, ProductCategory } from '../types/Product';
import { NotFoundError } from '../errors/NotFoundError';
import { ValidationError } from '../errors/ValidationError';
import { resolveVariantsFromPayload } from '../utils/productVariants';

type LegacyStockInput = {
  size?: string;
  color?: string | null;
  quantity?: number;
};

type ProductCreateInput = Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'variants'> & {
  variants?: Product['variants'];
  stock?: LegacyStockInput[];
  colors?: string[];
};

type ProductUpdateInput = Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'variants'>> & {
  variants?: Product['variants'];
  stock?: LegacyStockInput[];
  colors?: string[];
};

//Servicios para Productos
export const ProductService = {
  //CREAR producto
  async createProduct(productData: ProductCreateInput): Promise<Product> {
    if (!productData.name || productData.name.trim() === '') {
      throw new ValidationError('Name is required', ['name']);
    }
    if (!productData.description || productData.description.trim() === '') {
      throw new ValidationError('Description is required', ['description']);
    }
    if (!productData.category) {
      throw new ValidationError('Category is required', ['category']);
    }
    if (!productData.price || productData.price <= 0) {
      throw new ValidationError('Price must be greater than 0', ['price']);
    }

    const variants = resolveVariantsFromPayload({
      variants: productData.variants,
      stock: productData.stock,
      colors: productData.colors,
      baseColor: productData.baseColor,
    });

    //valores por defecto
    const newProduct: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> = {
      name: productData.name,
      description: productData.description,
      category: productData.category,
      tags: productData.tags || [],
      price: productData.price,
      images: productData.images || [],
      variants,
      isActive: productData.isActive ?? true,
    };

    if (productData.baseColor !== undefined && productData.baseColor.trim() !== '') {
      newProduct.baseColor = productData.baseColor;
    }
    if (productData.discountPrice !== undefined) {
      newProduct.discountPrice = productData.discountPrice;
    }
    
    // Si hay descuento, validar que sea menor al precio original
    if (productData.discountPrice) {
      if (productData.discountPrice >= productData.price) {
        throw new ValidationError('Discount price must be less than the original price', ['discountPrice']);
      }
      if (productData.discountPrice <= 0) {
        throw new ValidationError('Discount price must be greater than 0', ['discountPrice']);
      }
    }

    // Generar tags automáticamente desde la categoría (esto es un ejemplo, puede ser más complejo)
    const tags = this.generateTagsFromCategory(newProduct.category as ProductCategory);
    newProduct.tags = tags;

    // Crear el producto
    return await ProductModel.create(newProduct);
  },

  //obtener un producto por id
  async getProductById(id: string): Promise<Product> {
    const product = await ProductModel.getById(id);
    if(!product) {
      throw new NotFoundError('Product', id);
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
  async updateProduct(id: string, updates: ProductUpdateInput): Promise<Product> {
    // Verificar que el producto existe
    const currentProduct = await this.getProductById(id);

    // Validaciones
    if (updates.name !== undefined && updates.name.trim() === '') {
      throw new ValidationError('Name cannot be empty', ['name']);
    }

    if (updates.price !== undefined && updates.price <= 0) {
      throw new ValidationError('Price must be greater than 0', ['price']);
    }

    // Validar descuento
    if (updates.discountPrice !== undefined) {
      const price = updates.price || currentProduct.price;
      
      if (updates.discountPrice >= price) {
        throw new ValidationError('Discount price must be less than the original price', ['discountPrice']);
      }
      if (updates.discountPrice <= 0) {
        throw new ValidationError('Discount price must be greater than 0', ['discountPrice']);
      }
    }

    // Si cambia la categoría, regenerar tags
    if (updates.category) {
      updates.tags = this.generateTagsFromCategory(updates.category as ProductCategory);
    }

    if (
      updates.variants !== undefined ||
      updates.stock !== undefined ||
      updates.colors !== undefined ||
      updates.baseColor !== undefined
    ) {
      updates.variants = resolveVariantsFromPayload({
        variants: updates.variants ?? currentProduct.variants,
        stock: updates.stock,
        colors: updates.colors,
        baseColor: updates.baseColor ?? currentProduct.baseColor,
      });
    }

    const { stock, colors, ...updatesWithoutLegacy } = updates;

    // Actualizar
    return await ProductModel.update(id, {
      ...updatesWithoutLegacy,
      updatedAt: new Date(),
    });
  },

  //soft delete
  async deactivateProduct(id: string): Promise<void> {
    await this.getProductById(id);
    await ProductModel.update(id, {
      isActive: false,
      updatedAt: new Date(),
    });
  },

  //reactivar producto
  async activateProduct(id: string): Promise<void> {
    await this.getProductById(id);
    await ProductModel.update(id, {
      isActive: true,
      updatedAt: new Date(),
    });
  },

  //eliminar producto fisicamente
  async deleteProduct(id: string): Promise<void> {
    await this.getProductById(id);
    await ProductModel.delete(id);
  },

  // Generar tags automáticamente desde la categoría
  generateTagsFromCategory(category: ProductCategory): string[] {
    const tags: string[] = [];

    // Extraer deporte
    if (category.includes('rugby')) {
      tags.push('rugby');
    } else if (category.includes('hockey')) {
      tags.push('hockey');
    }

    // Extraer tipo de prenda
    const categories = category.split('-');
    if (categories.length > 0) {
      tags.push(categories[0] ?? ''); // 'camisetas', 'shorts', etc.
    }

    return tags;
  },

  // Validar stock disponible
  async checkStock(productId: string, size: string, color: string, quantity: number): Promise<boolean> {
    const product = await ProductModel.getById(productId);
    if (!product) {
      throw new NotFoundError('Product', productId);
    }

    const normalizedColor = color.trim().toUpperCase();
    const normalizedSize = size.trim().toUpperCase();
    const variant = product.variants.find((entry) => entry.color === normalizedColor);
    const sizeEntry = variant?.sizes.find((entry) => entry.size === normalizedSize);

    if (!sizeEntry) {
      return false;
    }

    return sizeEntry.quantity >= quantity;
  },
}