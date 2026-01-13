import { Request, Response, NextFunction } from 'express';
import {AppError} from '../errors/AppError';
import logger from '../config/logger';

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    logger.error({
      message: err.message,
      statusCode: err.statusCode,
      context: err.context,
      stack: err.stack,
      path: req.path,
      method: req.method,
      ip: req.ip,
    });
    return res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        ...(err.context && { context: err.context }),
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
      },
    });
  }


  
}