export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context?: string;

  constructor(
    statusCode: number,
    message: string,
    isOperational: boolean = true,
    context?: string
  ) {
    super(message);
    
    // Esto es importante para que TypeScript reconozca la clase correctamente
    Object.setPrototypeOf(this, AppError.prototype);
    
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = context || '';
    this.name = this.constructor.name;

    // Captura el stack trace (útil para debugging)
    Error.captureStackTrace(this, this.constructor);
  }
}
