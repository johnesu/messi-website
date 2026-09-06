import { z } from 'zod';

const email = z.string().email('Invalid email address');
const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[a-z]/, 'Password must contain lowercase letter')
  .regex(/[A-Z]/, 'Password must contain uppercase letter')
  .regex(/[0-9]/, 'Password must contain a number');

export const registerSchema = z.object({
  email,
  password,
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({ email });
export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password,
});
export const verifyEmailSchema = z.object({ token: z.string().min(1) });
export const refreshTokenSchema = z.object({ refreshToken: z.string().min(1) });

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: password,
});

export const addressSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().min(1),
  addressLine1: z.string().min(1),
  addressLine2: z.string().optional().nullable(),
  city: z.string().min(1),
  state: z.string().min(1),
  postalCode: z.string().optional().nullable(),
  country: z.string().default('Nigeria'),
  isDefault: z.boolean().default(false),
});

const price = z.number().nonnegative('Price cannot be negative');
const uuid = z.string().uuid('Invalid id');

export const createProductSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().optional(),
  sku: z.string().min(1),
  description: z.string().optional().nullable(),
  shortDescription: z.string().optional().nullable(),
  price: price,
  salePrice: price.optional().nullable(),
  costPrice: price.optional().nullable(),
  categoryIds: z.array(uuid).optional().default([]),
  brandId: uuid.optional().nullable(),
  tags: z.array(z.string()).optional().default([]),
  attributes: z.record(z.string(), z.string()).optional().default({}),
  images: z
    .array(
      z.object({
        url: z.string().min(1),
        alt: z.string().optional().nullable(),
        position: z.number().int().default(0),
      }),
    )
    .optional()
    .default([]),
  variants: z
    .array(
      z.object({
        sku: z.string().min(1),
        price: price,
        salePrice: price.optional().nullable(),
        costPrice: price.optional().nullable(),
        stock: z.number().int().nonnegative().default(0),
        attributes: z.record(z.string(), z.string()),
        imageUrl: z.string().optional().nullable(),
        barcode: z.string().optional().nullable(),
      }),
    )
    .optional()
    .default([]),
  weight: z.number().nonnegative().optional().nullable(),
  dimensions: z
    .object({
      length: z.number().optional().nullable(),
      width: z.number().optional().nullable(),
      height: z.number().optional().nullable(),
    })
    .optional()
    .nullable(),
  status: z.enum(['DRAFT', 'ACTIVE', 'OUT_OF_STOCK', 'ARCHIVED']).default('DRAFT'),
  featured: z.boolean().default(false),
  seoTitle: z.string().optional().nullable(),
  seoDescription: z.string().optional().nullable(),
});

export const updateProductSchema = createProductSchema.partial();

export const createCategorySchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().optional(),
  description: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  parentId: uuid.optional().nullable(),
});

export const addToCartSchema = z.object({
  productId: uuid.optional().nullable(),
  variantId: uuid.optional().nullable(),
  quantity: z.number().int().positive().default(1),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().positive(),
});

export const applyCouponSchema = z.object({ code: z.string().min(1) });

export const createReviewSchema = z.object({
  productId: uuid,
  rating: z.number().int().min(1).max(5),
  title: z.string().min(1).max(200).optional(),
  body: z.string().min(1).max(5000),
  images: z.array(z.string()).optional().default([]),
});

export const checkoutSchema = z.object({
  shippingAddressId: uuid.optional().nullable(),
  shippingAddress: addressSchema.optional(),
  shippingMethodId: uuid.optional().nullable(),
  couponCode: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const paginationQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const productSearchQuery = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    q: z.string().optional(),
    category: z.string().optional(),
    brand: z.string().optional(),
    minPrice: z.coerce.number().optional(),
    maxPrice: z.coerce.number().optional(),
    inStock: z.coerce.boolean().optional(),
    sort: z
      .enum(['price_asc', 'price_desc', 'newest', 'popular', 'rating'])
      .optional()
      .default('newest'),
    rating: z.coerce.number().optional(),
  });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type ProductSearchInput = z.infer<typeof productSearchQuery>;
