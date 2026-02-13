
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

export interface VariantSize {
  size: string;
  quantity: number;
}

export interface ProductVariant {
  color: string;
  sizes: VariantSize[];
}
export interface Product {
  id: string;
  name: string;
  description: string;
  category: ProductCategory;
  baseColor?: string;
  variants: ProductVariant[];
  tags: string[];
  price: number;
  discountPrice?: number;
  images: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}