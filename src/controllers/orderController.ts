import { Request, Response } from "express";
import { OrderService } from "../services/OrderService";
import { AuthenticatedRequest } from "../middleware/auth";
import { OrderStatus } from "../types/";

export const orderController = {
  //Crear orden POST (public)
  async createOrder(req: Request, res: Response) {
    try {
      const { customer, items, paymentMethod } = req.body;

      if(!customer || !items || !paymentMethod) {
        return res.status(400).json({
          error: 'Customer, items and payment method are required'
        });
      }

      if(!customer.name || !customer.email || !customer.phone) {
        return res.status(400).json({
          error: 'Customer name, email and phone are required'
        });
      }

      if(!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          error: 'Items must be an array and must contain at least one item'
        });
      }

      //validar items
      for (const item of items) {
        if(!item.productId || !item.size || !item.color || !item.quantity) {
          return res.status(400).json({
            error: 'Each item must have a productId, size, color and quantity'
          });
        }

        if(item.quantity <= 0) {
          return res.status(400).json({
            error: 'Quantity must be greater than 0'
          });
        }
      }

      const order = await OrderService.createOrder(
        customer,
        items,
        paymentMethod
      );

      return res.status(201).json({
        message: 'Order created successfully',
        order,
      });
    } catch (error: any) {
      const statusCode = error.message.includes('not found') ||
                         error.message.includes('Stock') 
                         ? 404 : 500;
      return res.status(statusCode).json({ message: error.message });
    }
  },

  //GET obtener order por numero de orden (public)
  async getOrderByNumber(req: Request, res: Response) {
    try {
      const { orderNumber } = req.body;

      if(!orderNumber) {
        return res.status(400).json({
          error: 'Order number is required'
        });
      }

      const order = await OrderService.getOrderByNumber(orderNumber);

      return res.status(200).json({
        message: 'Order fetched successfully',
        order,
      });
    } catch (error: any) {
      const statusCode = error.message.includes('not found') ? 404 : 500;
      return res.status(statusCode).json({ message: error.message });
    }
  },

  //GET obtener todas las ordenes (Admin)
  async getAllOrders(req: AuthenticatedRequest, res: Response) {
    try {
      const { status, customerEmail } = req.query;

      const filters: { status?: OrderStatus; customerEmail?: string } = {};

      if(status) {
        filters.status = status as OrderStatus;
      }

      if(customerEmail) {
        filters.customerEmail = customerEmail as string;
      }

      const orders = await OrderService.getAllOrders(filters);
      return res.status(200).json({
        message: 'Orders fetched successfully',
        orders,
        count: orders.length,
      })
    } catch (error: any) {
      return res.status(500).json({
        error: 'Internal server error',
        message: error.message,
       });
    }
  },

  //Get obtener orden por id (Admin)
  async getOrderById(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params
      if(!id) {
        return res.status(400).json({
          error: 'Order ID is required'
        });
      }
      const order = await OrderService.getOrderById(id as string);
      return res.status(200).json({
        message: 'Order fetched successfully',
        order,
      });
    } catch (error: any) {
      const statusCode = error.message.includes('not found') ? 404 : 500;
      return res.status(statusCode).json({ message: error.message });
    }
  },

  //post cancelar orden (public)
  async cancelOrder(req:Request, res: Response) {
    try {
      const { orderId } = req.body;

      if(!orderId) {
        return res.status(400).json({
          error: 'Order ID is required'
        });
      }

      const order = await OrderService.cancelOrder(orderId as string);
      return res.status(200).json({
        message: 'Order cancelled successfully',
        order,
      });
    } catch (error: any) {
      const statusCode = error.message.includes('not found') ||
                         error.message.includes('Only orders with status pending payment can be canceled') ? 400 : 500;
      return res.status(statusCode).json({ message: error.message });
    }
  },

  //Post para marcar orden como entregada (Admin)
  async markAsDelivered(req: AuthenticatedRequest, res: Response) {
    try {
      const { orderId } = req.body;

      if(!orderId) {
        return res.status(400).json({error: ' order ID is required'})
      }

      const order = await OrderService.markAsDelivered(orderId as string);
      return res.status(200).json({
        message: 'Order marked as delivered successfully',
        order,
      });
    } catch (error: any) {
      const statusCode = error.message.includes('not found') ||
                         error.message.includes('Only orders with status payment confirmed can be marked as delivered') ? 400 : 500;
      return res.status(statusCode).json({ message: error.message });
    }
  }
}