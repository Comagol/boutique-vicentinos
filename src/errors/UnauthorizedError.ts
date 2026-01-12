import { AppError } from './AppError';

export class UnauthorizedError extends AppError {
 constructor(message: string = 'Authentication required') {
  super(401, message, true);
 }
}