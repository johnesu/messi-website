import type {
  RoleName,
  OrderStatus,
  PaymentStatus,
  ProductStatus,
  ContentStatus,
  ReviewStatus,
  InventoryTransactionType,
} from '@mesi/config';

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  items: T[];
  meta: PaginationMeta;
}

export interface UserDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  emailVerified: boolean;
  roles: RoleName[];
  createdAt: string;
  isActive: boolean;
}

export interface AuthResponse {
  user: UserDto;
  accessToken: string;
  refreshToken: string;
}

export interface CategoryDto {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  parentId: string | null;
  children?: CategoryDto[];
  productCount: number;
}

export interface BrandDto {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
}

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

export interface AddressDto {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  postalCode: string | null;
  country: string;
  isDefault: boolean;
}

export interface OrderItemDto {
  id: string;
  productId: string;
  productName: string;
  variantId: string | null;
  variantLabel: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  imageUrl: string | null;
}

export interface OrderDto {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  items: OrderItemDto[];
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
  customer: {
    email: string;
    firstName: string;
    lastName: string;
    phone: string | null;
  };
  shippingAddress: AddressDto | null;
}

export interface PageSectionDto {
  id: string;
  type: string;
  settings: Record<string, unknown>;
  position: number;
  enabled: boolean;
}

export interface PageDto {
  id: string;
  title: string;
  slug: string;
  status: ContentStatus;
  sections: PageSectionDto[];
  seoTitle: string | null;
  seoDescription: string | null;
  publishedAt: string | null;
  updatedAt: string;
}

export interface BlogPostDto {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  coverImage: string | null;
  authorName: string;
  status: ContentStatus;
  categoryName: string | null;
  tags: string[];
  publishedAt: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
}

export { RoleName, OrderStatus, PaymentStatus, ProductStatus, ContentStatus, ReviewStatus };
