import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { CustomerModel } from '../models/Customer';
import { AdminModel } from '../models/Admin';
import { JwtPayload } from '../types/User';
import { getJwtSecret } from '../config/jwt';
import { authConfig, bcryptConfig } from '../config/auth';

export const CustomerAuthService = {
  //REGISTRAR CUSTOMER
  async signup(email: string, password: string, name: string) {
    const existing = await CustomerModel.getByEmail(email) || await AdminModel.getByEmail(email);
    if(existing) {
      throw new Error('Email already registered');
    }

    if(password.length < authConfig.password.minLength) {
      throw new Error(`Password must be at least ${authConfig.password.minLength} characters long`);
    }

    const passwordHash = await bcrypt.hash(password, bcryptConfig.saltRounds);

    const customer = await CustomerModel.create({
      email,
      name,
      passwordHash,
      role: 'customer',
      isActive: true,
    });

    const token = this.generateToken({
      id: customer.id,
      email: customer.email,
      role: customer.role,
    });

    const { passwordHash: _, ...customerWithoutPassword } = customer;
    return {
      customer: customerWithoutPassword,
      token,
    };
  },

  //LOGIN CUSTOMER
  async login(email: string, password:string) {
    const customer = await CustomerModel.getByEmail(email);
    if(!customer) {
      throw new Error('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, customer.passwordHash);
    if(!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    await CustomerModel.update(customer.id, { lastLoginAt: new Date() });

    const token = this.generateToken({
      id: customer.id,
      email: customer.email,
      role: customer.role,
    });

    const { passwordHash: _, ...customerWithoutPassword } = customer;
    return {
      customer: customerWithoutPassword,
      token
    };
  },

  //genero token
  generateToken(payload: JwtPayload): string {
    return jwt.sign(payload, getJwtSecret(), { expiresIn: '1h' }) as string;
  },

  //verico token
  verifyToken(token: string): JwtPayload {
    try {
      const decoded = jwt.verify(token, getJwtSecret()) as JwtPayload
      return decoded;
    } catch (error) {
      throw new Error('Invalid token');
    }
  },

  //cambiar contraseña
  async changePassword(customerId:string, oldPassword:string, newPassword:string) {
    const customer = await CustomerModel.getById(customerId);
    if(!customer) {
      throw new Error('Customer not found');
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, customer.passwordHash);
    if(!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    if(newPassword.length < authConfig.password.minLength) {
      throw new Error(`Password must be at least ${authConfig.password.minLength} characters long`);
    }
  },
}