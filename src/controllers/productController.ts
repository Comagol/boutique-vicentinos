import { Request, Response } from "express";
import { ProductService } from "../services/ProductService";
import { AuthenticatedRequest } from "../middleware/auth";
import { ProductCategory } from "../types/Product";
import { StorageService } from "../services/StorageService";

export const productController = {
  //Get all products (PUBLIC)
  async getAllProducts(req: Request, res: Response) {
    try {
      const { category } = req.query;
      const products = await ProductService.getAllActiveProducts(category as ProductCategory | undefined);
      return res.status(200).json({
        message: 'Products fetched successfully',
        products,
        count: products.length,
      });
    } catch (error: any) {
      return res.status(500).json({
        error: 'Internal server error',
        message: error.message,
      });
    }
  },

  //Get product by id (PUBLIC)
  async getProductById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const product = await ProductService.getProductById(id as string);
      return res.status(200).json({
        message: 'Product fetched successfully',
        product,
      })
    } catch (error: any) {
      const statusCode = error.message === 'Product not found' ? 404 : 500;
      return res.status(statusCode).json({ message: error.message });
    }
  },

  //POST create product (ADMIN)
  async createProduct(req: AuthenticatedRequest, res: Response) {
    try {
      
      let imageUrls: string[] = [];
      
      // Si hay archivos subidos, subirlos a Firebase Storage
      if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        const files = req.files as Express.Multer.File[];
        
        // 1. Subir archivos a Firebase Storage
        console.log('☁️ Subiendo archivos a Firebase Storage...');
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
      
      const product = await ProductService.createProduct(req.body);
      
      return res.status(201).json({
        message: 'Product created successfully',
        product,
      });
    } catch (error: any) {
      console.error('❌ Error al crear producto:', error);
      
      // Si hay archivos temporales y falló, intentar limpiarlos
      if (req.files && Array.isArray(req.files)) {
        try {
          await StorageService.deleteLocalFiles(req.files as Express.Multer.File[]);
        } catch (cleanupError) {
          console.error('Error limpiando archivos temporales:', cleanupError);
        }
      }
      
      const statusCode = error.message.includes('required') ? 400 : 500;
      return res.status(statusCode).json({ message: error.message });
    }
  },

  //PUT update prduct (ADMIN)
  async updateProduct(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const product = await ProductService.updateProduct(id as string, req.body);
      return res.status(200).json({
        message: 'Product updated successfully',
        product,
      });
    } catch (error: any) {
      const statusCode = error.message.includes('required') ? 400 : 500;
      return res.status(statusCode).json({ message: error.message });
    }
  },

  //Delete product (ADMIN)
  async deleteProduct(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      await ProductService.deleteProduct(id as string);
      return res.status(200).json({
        message: 'Product deleted successfully',
      });
    } catch (error: any) {
      const statusCode = error.message === 'Product not found' ? 404 : 500;
      return res.status(statusCode).json({ message: error.message });
    }
  },

  //POST activate product (ADMIN)
  async activateProduct(req:AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      await ProductService.activateProduct(id as string);
      return res.status(200).json({
        message: 'Product activated successfully',
      });
    } catch (error: any) {
      const statusCode = error.message === 'Product not found' ? 404 : 500;
      return res.status(statusCode).json({ message: error.message });
    }
  },

  //POST deactivate product (ADMIN)
  async deactivateProduct(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      await ProductService.deactivateProduct(id as string);
      return res.status(200).json({
        message: 'Product deactivated successfully',
      });
    } catch (error: any) {
      const statusCode = error.message === 'Product not found' ? 404 : 500;
      return res.status(statusCode).json({ message: error.message });
    }
  },

  //GET all products including deactivated (ADMIN)
  async getAllProductsAdmin(req: AuthenticatedRequest, res: Response) {
    try {
      const { category } = req.query;
      const products = await ProductService.getAllProducts(category as ProductCategory);
      return res.status(200).json({
        message: 'Products fetched successfully',
        products,
        count: products.length,
      });
    } catch (error: any) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
}