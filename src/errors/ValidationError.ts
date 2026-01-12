import { AppError } from "./AppError";

export class ValidationError extends AppError {
  public readonly fields: string[] | undefined;

  constructor(message: string, fields?: string[]) {
    super(400, message, true, fields?.join(', ') || '');
    this.fields = fields;
  }
}