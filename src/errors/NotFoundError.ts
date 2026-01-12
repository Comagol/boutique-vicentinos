import { AppError } from "./AppError";

export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string) {
    const message = identifier 
    ? `${resource} with identifier ${identifier} not found`
    : `${resource} not found`;
    
    super(404, message, true, `NotFoundError: ${resource}`);
  }
}