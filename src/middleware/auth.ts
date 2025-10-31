import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { JwtPayload } from '../types/User';

//extiendo el request para inclui user
export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}