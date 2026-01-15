import { Response } from 'express';
import { AuthService } from '../services/AuthService';
import { AuthenticatedRequest } from '../middleware/auth';
import { ValidationError } from '../errors/ValidationError';

export const authController = {
  async login(req: AuthenticatedRequest, res: Response) {
      const { email, password } = req.body;

      if(!email || !password) {
        throw new ValidationError('Email and password are required');
      }

      const result = await AuthService.login(email, password);
      return res.status(200).json({
        message: 'Login successful',
        admin: result.admin,
        token: result.token,
      });
  },

  //Signup (crear admin)
  async signup(req: AuthenticatedRequest, res: Response) {
      const { email, password, name } = req.body;

      if(!email || !password || !name) {
        throw new ValidationError('Email, password and name are required');
      }

      const result = await AuthService.signup(email, password, name);
      return res.status(201).json({
        message: 'Admin created successfully',
        admin: result.admin,
        token: result.token,
      });
  },

  //Cambiar contraseña
  async changePassword(req: AuthenticatedRequest, res: Response) {
      if(!req.user) {
        throw new ValidationError('Authentication required');
      }

      const { oldPassword, newPassword } = req.body;

      if(!oldPassword || !newPassword) {
        throw new ValidationError('Old password and new password are required');
      }

      await AuthService.changePassword(req.user.id, oldPassword, newPassword);
      return res.status(200).json({
        message: 'Password changed successfully',
      });
  },
}