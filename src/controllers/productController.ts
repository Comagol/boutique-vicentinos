import { Request, Response } from "express";
import { ProductService } from "../services/ProductService";
import { AuthenticatedRequest } from "../middleware/auth";
import { ProductCategory } from "../types/Product";

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
      const product = await ProductService.createProduct(req.body);
      return res.status(201).json({
        message: 'Product created successfully',
        product,
      });
    } catch (error: any) {
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