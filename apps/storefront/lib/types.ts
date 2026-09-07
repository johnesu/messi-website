export type ProductStatus = 'DRAFT' | 'ACTIVE' | 'OUT_OF_STOCK' | 'ARCHIVED';

export interface ProductImageDto {
  id: string;
  url: string;
  alt: string | null;
  position: number;
}

export interface VariantDto {
  id: string;
  sku: string;
  price: number;
  salePrice: number | null;
  stock: number;
  attributes: Record<string, string>;
  imageUrl: string | null;
  barcode: string | null;
}

export interface ProductDto {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description: string | null;
  shortDescription: string | null;
  price: number;
  salePrice: number | null;
  costPrice: number | null;
  status: ProductStatus;
  featured: boolean;
  rating: number;
  reviewCount: number;
  images: ProductImageDto[];
  variants: VariantDto[];
  categoryIds: string[];
  brandId: string | null;
  tags: string[];
  attributes: Record<string, string>;
  stock: number;
  seoTitle: string | null;
  seoDescription: string | null;
  createdAt: string;
}

export interface CartLineDto {
  variantId: string;
  product: ProductDto;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface CartDto {
  id: string;
  items: CartLineDto[];
  couponCode: string | null;
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  itemCount: number;
}