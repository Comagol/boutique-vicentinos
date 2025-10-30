import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AdminModel } from '../models/Admin';
import { AdminUser, JwtPayload } from '../types/User';
import { jwtConfig, getJwtSecret } from '../config/jwt';
import { authConfig, bcryptConfig } from '../config/auth';

export const AuthService = {
  //REGISTRAR ADMIN
  async signup(email: string, password: string, name: string) {
    const existing = await AdminModel.getByEmail(email);
    if(existing) {
      throw new Error('Email already registered');
    }

    if(password.length < authConfig.password.minLength) {
      throw new Error(`Password must be at least ${authConfig.password.minLength} characters long`);
    }

    const passwordHash = await bcrypt.hash(password, bcryptConfig.saltRounds);

    const admin = await AdminModel.create({
      email,
      name,
      passwordHash,
      role: 'admin',
      isActive: true,
    });

    const token = this.generateToken({
      id: admin.id,
      email: admin.email,
      role: admin.role,
    });

    const { passwordHash: _, ...adminWithoutPassword } = admin;
    return {
      admin: adminWithoutPassword,
      token,
    };
  },

  //LOGIN 
  async login(email: string, password:string) {
    const admin = await AdminModel.getByEmail(email);
    if(!admin) {
      throw new Error('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, admin.passwordHash);
    if(!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    await AdminModel.update(admin.id, { lastLoginAt: new Date() });

    const token = this.generateToken({
      id: admin.id,
      email: admin.email,
      role: admin.role,
    });

    const { passwordHash: _, ...adminWithoutPassword } = admin;
    return {
      admin: adminWithoutPassword,
      token,
    };
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

  //genero token
  generateToken(payload: JwtPayload): string {
    return jwt.sign(payload, getJwtSecret(), { expiresIn: '1h' }) as string;
  },

  //cambiar contraseña
  async changePassword(adminId:string, oldPassword:string, newPassword:string) {
    const admin = await AdminModel.getById(adminId);
    if(!admin) {
      throw new Error('Admin not found');
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, admin.passwordHash);
    if(!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    if(newPassword.length < authConfig.password.minLength) {
      throw new Error(`Password must be at least ${authConfig.password.minLength} characters long`);
    }

    const passwordHash = await bcrypt.hash(newPassword, bcryptConfig.saltRounds);
    await AdminModel.update(adminId, { passwordHash });
  },
};