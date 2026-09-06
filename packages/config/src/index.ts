import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  PAYSTACK_SECRET_KEY: z.string().default(''),
  PAYSTACK_PUBLIC_KEY: z.string().default(''),
  PAYSTACK_TEST_MODE: z.coerce.boolean().default(true),
  STORAGE_ENDPOINT: z.string().default(''),
  STORAGE_ACCESS_KEY: z.string().default(''),
  STORAGE_SECRET_KEY: z.string().default(''),
  STORAGE_BUCKET: z.string().default('mesi'),
  STORAGE_PUBLIC_URL: z.string().default(''),
  EMAIL_PROVIDER: z.enum(['console', 'smtp', 'resend']).default('console'),
  EMAIL_FROM: z.string().default('no-reply@mesi.local'),
  SMTP_HOST: z.string().default(''),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().default(''),
  SMTP_PASS: z.string().default(''),
  CORS_ORIGINS: z.string().default('http://localhost:3000,http://localhost:3001'),
  RATE_LIMIT_TTL: z.coerce.number().default(60),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  STORE_CURRENCY: z.string().default('NGN'),
  STORE_NAME: z.string().default('MESI Marketplace'),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function loadEnv(env: NodeJS.ProcessEnv = process.env): EnvConfig {
  const result = envSchema.safeParse(env);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  return result.data;
}

export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  STORE_MANAGER: 'STORE_MANAGER',
  INVENTORY_MANAGER: 'INVENTORY_MANAGER',
  ORDER_MANAGER: 'ORDER_MANAGER',
  CONTENT_EDITOR: 'CONTENT_EDITOR',
  MARKETING_MANAGER: 'MARKETING_MANAGER',
  WAREHOUSE_MANAGER: 'WAREHOUSE_MANAGER',
  CASHIER: 'CASHIER',
  CUSTOMER: 'CUSTOMER',
} as const;

export type RoleName = (typeof ROLES)[keyof typeof ROLES];

export const DEFAULT_CURRENCY = 'NGN';
export const DEFAULT_LOCALE = 'en';

export const ORDER_STATUSES = [
  'PENDING',
  'PAID',
  'PROCESSING',
  'PACKED',
  'SHIPPED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
  'REFUNDED',
  'PARTIALLY_REFUNDED',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = [
  'PENDING',
  'INITIALIZED',
  'SUCCESSFUL',
  'FAILED',
  'CANCELLED',
  'REFUNDED',
  'PARTIALLY_REFUNDED',
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const INVENTORY_TRANSACTION_TYPES = [
  'PURCHASE',
  'SALE',
  'RETURN',
  'ADJUSTMENT',
  'TRANSFER',
  'DAMAGED',
  'MANUAL_CORRECTION',
] as const;

export type InventoryTransactionType = (typeof INVENTORY_TRANSACTION_TYPES)[number];

export const PRODUCT_STATUSES = ['DRAFT', 'ACTIVE', 'OUT_OF_STOCK', 'ARCHIVED'] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export const CONTENT_STATUSES = ['DRAFT', 'PUBLISHED', 'SCHEDULED', 'ARCHIVED'] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export const REVIEW_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];
