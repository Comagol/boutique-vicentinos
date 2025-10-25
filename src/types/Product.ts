import { StringifyOptions } from "querystring";

export type ProductCategory =
| 'camisetas-rugby'
| 'camisetas-hockey'
| 'shorts-rugby'
| 'polleras-hockey'
| 'medias-rugby'
| 'medias-hockey'
| 'pantalones'
| 'shorts'
| 'buzos'
| 'gorras'
| 'camperas'
| 'camperon'
| 'bolsos'
| 'gorros'
| 'otros';

export type SizeType = 'adulto' | 'infantil';

export interface ProductSize {
  size: string;
  type: SizeType;
}

export interface StockInfo {
  size: string;
  color?: string;
  quantity: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: ProductCategory;
  baseColor?: string;
  tags: string[];
  price: number;
  discount?: number;
  images: string[];
  sizes: ProductSize[];
  colors: string[];
  stock: StockInfo[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}