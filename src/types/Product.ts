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