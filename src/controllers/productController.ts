import { response, Response } from "express";
import { ProductService } from "../services/ProductService";
import { AuthenticatedRequest } from "../middleware/auth";
import { ProductCategory } from "../types/Product";

export const productController = {
  //Get all products
  async getAllProducts(req: AuthenticatedRequest, res: Response) {
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

  //Get product by id
  async getProductById(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
    } catch (error) {
      
    }
  }
}