import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { CustomerModel } from '../models/Customer';
import { JwtPayload } from '../types/User';
import { getJwtSecret } from '../config/jwt';
import { authConfig, bcryptConfig } from '../config/auth';

export const CustomerAuthService = {
  //REGISTRAR CUSTOMER
  async signup(email: string, password: string, name: string) {
    const existing = await CustomerModel.getByEmail(email);
    if(existing) {
      throw new Error('Email already registered');
    }

    if(password.length < authConfig.password.minLength) {
      throw new Error(`Password must be at least ${authConfig.password.minLength} characters long`);
    }

    
  }
}