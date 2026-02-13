import { Request, Response } from "express";
import { ProductService } from "../services/ProductService";
import { AuthenticatedRequest } from "../middleware/auth";
import { ProductCategory } from "../types/Product";
import { StorageService } from "../services/StorageService";
import { ValidationError } from "../errors/ValidationError";

export const productController = {
  //Get all products (PUBLIC)
  async getAllProducts(req: Request, res: Response) {
      const { category } = req.query;
      const products = await ProductService.getAllActiveProducts(category as ProductCategory | undefined);
      return res.status(200).json({
        message: 'Products fetched successfully',
        products,
        count: products.length,
      });
  },

  //Get product by id (PUBLIC)
  async getProductById(req: Request, res: Response) {
      const { id } = req.params;
      const product = await ProductService.getProductById(id as string);
      return res.status(200).json({
        message: 'Product fetched successfully',
        product,
      });
  },

  //POST create product (ADMIN)
  async createProduct(req: AuthenticatedRequest, res: Response) {
      
      let imageUrls: string[] = [];
      
      // Si hay archivos subidos, subirlos a Firebase Storage
      if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        const files = req.files as Express.Multer.File[];
        
        // 1. Subir archivos a Firebase Storage
        imageUrls = await StorageService.uploadMultipleFiles(files);
        
        // 2. Eliminar archivos temporales locales
        await StorageService.deleteLocalFiles(files);
        
        // 3. Si ya hay imágenes en el body, combinarlas; si no, usar solo las subidas
        if (req.body.images) {
          const existingImages = typeof req.body.images === 'string' 
            ? JSON.parse(req.body.images) 
            : req.body.images;
          req.body.images = [...existingImages, ...imageUrls];
        } else {
          req.body.images = imageUrls;
        }
      }
      
      // Normalizar datos que vienen como strings desde form-data
      const normalizedData: any = {
        ...req.body,
        // Convertir números
        price: typeof req.body.price === 'string' ? parseFloat(req.body.price) : req.body.price,
        discountPrice: req.body.discountPrice && req.body.discountPrice !== ''
          ? (typeof req.body.discountPrice === 'string' ? parseFloat(req.body.discountPrice) : req.body.discountPrice)
          : undefined,
        // Convertir booleanos
        isActive: req.body.isActive !== undefined 
          ? (typeof req.body.isActive === 'string' 
              ? req.body.isActive.toLowerCase() === 'true' || req.body.isActive === '1'
              : Boolean(req.body.isActive))
          : true, // Por defecto true
      };
      
      // Parsear arrays JSON si vienen como strings
      normalizedData.variants = typeof req.body.variants === 'string' && req.body.variants.trim() !== ''
        ? JSON.parse(req.body.variants)
        : (Array.isArray(req.body.variants) ? req.body.variants : undefined);

      // Compatibilidad temporal: si no viene variants, aceptar payload legacy
      normalizedData.colors = typeof req.body.colors === 'string' && req.body.colors.trim() !== ''
        ? JSON.parse(req.body.colors)
        : (Array.isArray(req.body.colors) ? req.body.colors : undefined);
      
      normalizedData.stock = typeof req.body.stock === 'string' && req.body.stock.trim() !== ''
        ? JSON.parse(req.body.stock)
        : (Array.isArray(req.body.stock) ? req.body.stock : undefined);
      
      // Las imágenes ya fueron procesadas arriba, pero asegurémonos de que sea array
      normalizedData.images = Array.isArray(normalizedData.images) ? normalizedData.images : [];
      
      const product = await ProductService.createProduct(normalizedData);
      
      return res.status(201).json({
        message: 'Product created successfully',
        product,
      });
  },

  //PUT update product (ADMIN)
  async updateProduct(req: AuthenticatedRequest, res: Response) {
      const { id } = req.params;
      
      let imageUrls: string[] = [];
      
      // Si hay archivos subidos, subirlos a Firebase Storage
      if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        const files = req.files as Express.Multer.File[];
        
        // 1. Subir archivos a Firebase Storage
        imageUrls = await StorageService.uploadMultipleFiles(files);
        
        // 2. Eliminar archivos temporales locales
        await StorageService.deleteLocalFiles(files);
        
        // 3. Si hay nuevas imágenes, reemplazar todas las existentes
        req.body.images = imageUrls;
      }
      
      // Normalizar datos que vienen como strings desde form-data
      const normalizedData: any = {};
      
      // Solo incluir campos que fueron enviados
      if (req.body.name !== undefined) normalizedData.name = req.body.name;
      if (req.body.description !== undefined) normalizedData.description = req.body.description;
      if (req.body.category !== undefined) normalizedData.category = req.body.category;
      if (req.body.baseColor !== undefined) normalizedData.baseColor = req.body.baseColor;
      
      // Convertir números
      if (req.body.price !== undefined) {
        normalizedData.price = typeof req.body.price === 'string' 
          ? parseFloat(req.body.price) 
          : req.body.price;
      }
      if (req.body.discountPrice !== undefined) {
        normalizedData.discountPrice = req.body.discountPrice === '' || req.body.discountPrice === null
          ? undefined
          : (typeof req.body.discountPrice === 'string' 
              ? parseFloat(req.body.discountPrice) 
              : req.body.discountPrice);
      }
      
      // Convertir booleanos
      if (req.body.isActive !== undefined) {
        normalizedData.isActive = typeof req.body.isActive === 'string' 
          ? (req.body.isActive.toLowerCase() === 'true' || req.body.isActive === '1')
          : Boolean(req.body.isActive);
      }
      
      // Parsear arrays JSON si vienen como strings
      if (req.body.variants !== undefined) {
        normalizedData.variants = typeof req.body.variants === 'string' && req.body.variants.trim() !== ''
          ? JSON.parse(req.body.variants)
          : (Array.isArray(req.body.variants) ? req.body.variants : []);
      }

      // Compatibilidad temporal: payload legacy
      if (req.body.colors !== undefined) {
        normalizedData.colors = typeof req.body.colors === 'string' && req.body.colors.trim() !== ''
          ? JSON.parse(req.body.colors)
          : (Array.isArray(req.body.colors) ? req.body.colors : []);
      }
      
      if (req.body.stock !== undefined) {
        normalizedData.stock = typeof req.body.stock === 'string' && req.body.stock.trim() !== ''
          ? JSON.parse(req.body.stock)
          : (Array.isArray(req.body.stock) ? req.body.stock : []);
      }
      
      if (req.body.images !== undefined) {
        normalizedData.images = typeof req.body.images === 'string' && req.body.images.trim() !== ''
          ? JSON.parse(req.body.images)
          : (Array.isArray(req.body.images) ? req.body.images : []);
      }
      
      if (req.body.tags !== undefined) {
        normalizedData.tags = typeof req.body.tags === 'string' && req.body.tags.trim() !== ''
          ? JSON.parse(req.body.tags)
          : (Array.isArray(req.body.tags) ? req.body.tags : []);
      }
      
      const product = await ProductService.updateProduct(id as string, normalizedData);
      
      return res.status(200).json({
        message: 'Product updated successfully',
        product,
      });
  },

  //Delete product (ADMIN)
  async deleteProduct(req: AuthenticatedRequest, res: Response) {
      const { id } = req.params;
      await ProductService.deleteProduct(id as string);
      return res.status(200).json({
        message: 'Product deleted successfully',
      });
  },

  //POST activate product (ADMIN)
  async activateProduct(req:AuthenticatedRequest, res: Response) {
      const { id } = req.params;
      await ProductService.activateProduct(id as string);
      return res.status(200).json({
        message: 'Product activated successfully',
      });
  },

  //POST deactivate product (ADMIN)
  async deactivateProduct(req: AuthenticatedRequest, res: Response) {
      const { id } = req.params;
      await ProductService.deactivateProduct(id as string);
      return res.status(200).json({
        message: 'Product deactivated successfully',
      });
  },

  //GET all products including deactivated (ADMIN)
  async getAllProductsAdmin(req: AuthenticatedRequest, res: Response) {
      const { category } = req.query;
      const products = await ProductService.getAllProducts(category as ProductCategory);
      return res.status(200).json({
        message: 'Products fetched successfully',
        products,
        count: products.length,
      });
  }
}