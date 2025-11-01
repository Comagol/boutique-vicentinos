import { Response } from 'express';
import { AuthService } from '../services/AuthService';
import { AuthenticatedRequest } from '../middleware/auth';

export const authController = {
  async login(req: AuthenticatedRequest, res: Response) {
    try {
      const { email, password } = req.body;

      if(!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const result = await AuthService.login(email, password);
      res.status(200).json({
        message: 'Login successful',
        admin: result.admin,
        token: result.token,
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'Internal server error',
        message: error.message,
      });
    }
  },

  //Signup (crear admin)
  async signup(req: AuthenticatedRequest, res: Response) {
    try {
      const { email, password, name } = req.body;

      if(!email || !password || !name) {
        return res.status(400).json({ error: 'Email, password and name are required' });
      }

      const result = await AuthService.signup(email, password, name);
      res.status(201).json({
        message: 'Admin created successfully',
        admin: result.admin,
        token: result.token,
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'Internal server error',
        message: error.message,
      });
    }
  },

  //Cambiar contraseña
  async changePassword(req: AuthenticatedRequest, res: Response) {
    try {
      if(!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { oldPassword, newPassword } = req.body;

      if(!oldPassword || !newPassword) {
        return res.status(400).json({ error: 'Old password and new password are required' });
      }

      await AuthService.changePassword(req.user.id, oldPassword, newPassword);
      res.status(200).json({
        message: 'Password changed successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'Internal server error',
        message: error.message,
      });
      
    }
  },

  
}