import { AppError } from "./AppError";

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden: Insufficient permissions') {
    super(403, message, true);
  }
}