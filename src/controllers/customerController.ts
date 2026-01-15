import {  Response } from 'express';
import { CustomerAuthService } from '../services/CustomerAuthService';
import { AuthenticatedRequest } from '../middleware/auth';
import { authConfig } from '../config/auth';
import { OrderService } from '../services/OrderService';
import { AdminModel } from '../models/Admin';
import { CustomerModel } from '../models/Customer';
import { ValidationError } from '../errors/ValidationError';

export const customerController = {
  //Signup (crear customer)
  async signup(req: AuthenticatedRequest, res: Response) {
      const { email, password, name } = req.body;

      if(!email || !password || !name) {
        throw new ValidationError('Email, password and name are required');
      }

      if(password.length < authConfig.password.minLength) {
        throw new ValidationError(`Password must be at least ${authConfig.password.minLength} characters long`);
      }

      const existing = await CustomerModel.getByEmail(email) || await AdminModel.getByEmail(email);
      if(existing) {
        throw new ValidationError('Email already registered');
      }

      const result = await CustomerAuthService.signup(email, password, name);
      return res.status(201).json({
        message: 'Customer created successfully',
        customer: result.customer,
        token: result.token,
      });
  },

  //Login (login customer)
  async login(req: AuthenticatedRequest, res: Response) {
      const { email, password } = req.body;

      if(!email || !password) {
        throw new ValidationError('Email and password are required');
      }

      const existing = await CustomerModel.getByEmail(email) || await AdminModel.getByEmail(email);
      if(!existing) {
        throw new ValidationError('Invalid credentials', ['Email not found or invalid']);
      }

      const result = await CustomerAuthService.login(email, password);
      return res.status(200).json({ message: 'Login successful', customer: result.customer, token: result.token });
  },

  //Cambiar contraseña
  async changePassword(req:AuthenticatedRequest, res:Response) {
      if(!req.user)  {
        throw new ValidationError('Authentication required');
      }

      const { oldPassword, newPassword } = req.body;
      if(!oldPassword || !newPassword) {
        throw new ValidationError('Old password and new password are required');
      }

      if(newPassword.length < authConfig.password.minLength) {
        throw new ValidationError(`Password must be at least ${authConfig.password.minLength} characters long`);
      }

      await CustomerAuthService.changePassword(req.user.id, oldPassword, newPassword);
      return res.status(200).json({ message: 'Password changed successfully' });
  },

  //Get Orders (GET /api/customers/orders)
  async getOrders(req: AuthenticatedRequest, res: Response) {
      if(!req.user) {
        throw new ValidationError('Authentication required');
      }

      const orders = await OrderService.getOrdersByCustomerEmail(req.user.email);
      return res.status(200).json(orders);
  },

  //Get Profile (GET /api/customers/profile)
  async getProfile(req: AuthenticatedRequest, res: Response) {
      if(!req.user) {
        throw new ValidationError('Authentication required');
      }

      const customer = await CustomerAuthService.getProfile(req.user.id);
      return res.status(200).json({
        message: 'Profile fetched successfully',
        customer: customer,
      });
  },
}