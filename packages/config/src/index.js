"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.REVIEW_STATUSES = exports.CONTENT_STATUSES = exports.PRODUCT_STATUSES = exports.INVENTORY_TRANSACTION_TYPES = exports.PAYMENT_STATUSES = exports.ORDER_STATUSES = exports.DEFAULT_LOCALE = exports.DEFAULT_CURRENCY = exports.ROLES = exports.envSchema = void 0;
exports.loadEnv = loadEnv;
const zod_1 = require("zod");
exports.envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'test', 'production']).default('development'),
    PORT: zod_1.z.coerce.number().default(4000),
    DATABASE_URL: zod_1.z.string().url(),
    REDIS_URL: zod_1.z.string().default('redis://localhost:6379'),
    JWT_ACCESS_SECRET: zod_1.z.string().min(16),
    JWT_REFRESH_SECRET: zod_1.z.string().min(16),
    JWT_ACCESS_EXPIRES_IN: zod_1.z.string().default('15m'),
    JWT_REFRESH_EXPIRES_IN: zod_1.z.string().default('7d'),
    PAYSTACK_SECRET_KEY: zod_1.z.string().default(''),
    PAYSTACK_PUBLIC_KEY: zod_1.z.string().default(''),
    PAYSTACK_TEST_MODE: zod_1.z.coerce.boolean().default(true),
    STORAGE_ENDPOINT: zod_1.z.string().default(''),
    STORAGE_ACCESS_KEY: zod_1.z.string().default(''),
    STORAGE_SECRET_KEY: zod_1.z.string().default(''),
    STORAGE_BUCKET: zod_1.z.string().default('mesi'),
    STORAGE_PUBLIC_URL: zod_1.z.string().default(''),
    EMAIL_PROVIDER: zod_1.z.enum(['console', 'smtp', 'resend']).default('console'),
    EMAIL_FROM: zod_1.z.string().default('no-reply@mesi.local'),
    SMTP_HOST: zod_1.z.string().default(''),
    SMTP_PORT: zod_1.z.coerce.number().default(587),
    SMTP_USER: zod_1.z.string().default(''),
    SMTP_PASS: zod_1.z.string().default(''),
    CORS_ORIGINS: zod_1.z.string().default('http://localhost:3000,http://localhost:3001'),
    RATE_LIMIT_TTL: zod_1.z.coerce.number().default(60),
    RATE_LIMIT_MAX: zod_1.z.coerce.number().default(100),
    STORE_CURRENCY: zod_1.z.string().default('NGN'),
    STORE_NAME: zod_1.z.string().default('MESI Marketplace'),
});
function loadEnv(env = process.env) {
    const result = exports.envSchema.safeParse(env);
    if (!result.success) {
        const issues = result.error.issues
            .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
            .join('\n');
        throw new Error(`Invalid environment configuration:\n${issues}`);
    }
    return result.data;
}
exports.ROLES = {
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
};
exports.DEFAULT_CURRENCY = 'NGN';
exports.DEFAULT_LOCALE = 'en';
exports.ORDER_STATUSES = [
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
];
exports.PAYMENT_STATUSES = [
    'PENDING',
    'INITIALIZED',
    'SUCCESSFUL',
    'FAILED',
    'CANCELLED',
    'REFUNDED',
    'PARTIALLY_REFUNDED',
];
exports.INVENTORY_TRANSACTION_TYPES = [
    'PURCHASE',
    'SALE',
    'RETURN',
    'ADJUSTMENT',
    'TRANSFER',
    'DAMAGED',
    'MANUAL_CORRECTION',
];
exports.PRODUCT_STATUSES = ['DRAFT', 'ACTIVE', 'OUT_OF_STOCK', 'ARCHIVED'];
exports.CONTENT_STATUSES = ['DRAFT', 'PUBLISHED', 'SCHEDULED', 'ARCHIVED'];
exports.REVIEW_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'];
