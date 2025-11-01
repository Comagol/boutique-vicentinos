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
    } catch (error) {
      
    }
  }
}