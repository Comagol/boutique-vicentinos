export type AdminRole = 'admin';

export interface AdminUser {
  id: string;
  email:string;
  name: string;
  passwordHash: string;
  role: AdminRole;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  isActive: boolean;
}

export interface JwtPayload {
  id: string;
  email: string;
  role: AdminRole;
}