import {  Response } from 'express';
import { CustomerAuthService } from '../services/CustomerAuthService';
import { AuthenticatedRequest } from '../middleware/auth';
import { error } from 'console';
import { authConfig } from '../config/auth';

export const customerController = {
  //Signup (crear customer)
  async signup(req: AuthenticatedRequest, res: Response) {
    try {
      const { email, password, name } = req.body;

      if(!email || !password || !name) {
        return res.status(400).json({ error: 'Email, password and name are required' });
      }

      const result = await CustomerAuthService.signup(email, password, name);
      return res.status(201).json({
        message: 'Customer created successfully',
        customer: result.customer,
        token: result.token,
      });
    } catch (error: any) {
      return res.status(500).json({
        error: 'Internal server error',
        message: error.message,
      });
    }

  },

  //Login (login customer)
  async login(req: AuthenticatedRequest, res: Response) {
    try {
      const { email, password } = req.body;

      if(!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const result = await CustomerAuthService.login(email, password);
      return res.status(200).json({
        message: 'Login successful',
        customer: result.customer,
        token: result.token,
      });
    } catch (error: any) {
      return res.status(500).json({
        error: 'Internal server error',
        message: error.message,
      });
    }
  },

  //Cambiar contraseña
  async changePassword(req:AuthenticatedRequest, res:Response) {
    try {
      if(!req.user)  {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { oldPassword, newPassword } = req.body;
      if(!oldPassword || !newPassword) {
        return res.status(400).json({ error: 'Old password and new password are required' });
      }

      if(newPassword.length < authConfig.password.minLength) {
        return res.status(400).json({ error: `Password must be at least ${authConfig.password.minLength} characters long` });
      }

      await CustomerAuthService.changePassword(req.user.id, oldPassword, newPassword);
      return res.status(200).json({
        message: 'Password changed successfully',
      });
    } catch (error: any) {
      return res.status(500).json({
        error: 'Internal server error',
        message: error.message,
      });
    }
  }
}