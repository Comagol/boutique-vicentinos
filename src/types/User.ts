export type AdminRole = 'admin';
export type CustomerRole = 'customer';
export type UserRole = AdminRole | CustomerRole;

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
  role: CustomerRole;
}

export interface CustomerUser {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: CustomerRole;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  isActive: boolean;
}