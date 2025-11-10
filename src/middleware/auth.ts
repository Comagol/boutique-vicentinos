import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { JwtPayload } from '../types/User';

//extiendo el request para incluir user y files
export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
  files?: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] } | undefined;
}

//middleware de autenticacion
export const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const token = authHeader.split(' ')[1]; // Bearer <token>

    if (!token) {
      res.status(401).json({ error: 'Invalid token format' });
      return;
    }

    const decoded = AuthService.verifyToken(token);
    req.user = decoded;

    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }
};

//middleware para verificar el rol de administrador
export const requireAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if(!req.user) {
    res.status(401).json({error: 'Authentication required'});
    return;
  }

  if(req.user.role !== 'admin') {
    res.status(403).json({error: 'Forbidden'});
    return;
  }
}