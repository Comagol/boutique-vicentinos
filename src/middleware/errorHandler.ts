import { Request, Response, NextFunction } from 'express';
import {AppError} from '../errors/AppError';
import logger from '../config/logger';
import path from 'path';

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
  if (err.name === 'MulterError') {
    logger.error({
      message: 'File upload error',
      error: err.message,
      stack: err.stack,
      path: req.path,
    });

    if (err.message === 'File too large') {
      return res.status(400).json({
        success: false,
        error: 'File too large',
        message: 'El archivo excede el tamaño máximo permitido (5MB)',
      });
    }
    return res.status(400).json({
      success: false,
      error: {
        message: 'Upload error',
        details: err.message,
      },
    });
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    logger.warn({
      message: 'Invalid JWT token',
      error: err.name,
      path: req.path,
      ip: req.ip,
    });

    return res.status(401).json({
      success: false,
      error: {
        message: 'Invalid or expired token',
      },
    });
  }

  
}