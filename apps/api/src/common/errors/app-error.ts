export class AppError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly statusCode: number = 400,
    readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class BadRequestError extends AppError {
  constructor(code: string, message: string, details?: Record<string, unknown>) {
    super(code, message, 400, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(code = 'UNAUTHORIZED', message = 'Authentication required') {
    super(code, message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(code = 'FORBIDDEN', message = 'You do not have permission to perform this action') {
    super(code, message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(code = 'NOT_FOUND', message = 'Resource not found') {
    super(code, message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(code = 'CONFLICT', message = 'Resource already exists') {
    super(code, message, 409);
  }
}

export class UnprocessableError extends AppError {
  constructor(code: string, message: string, details?: Record<string, unknown>) {
    super(code, message, 422, details);
  }
}

export class RateLimitError extends AppError {
  constructor() {
    super('RATE_LIMIT_EXCEEDED', 'Too many requests', 429);
  }
}

export const ErrorCodes = {
  PRODUCT_OUT_OF_STOCK: 'PRODUCT_OUT_OF_STOCK',
  INSUFFICIENT_STOCK: 'INSUFFICIENT_STOCK',
  COUPON_INVALID: 'COUPON_INVALID',
  COUPON_EXPIRED: 'COUPON_EXPIRED',
  COUPON_USED: 'COUPON_USED',
  CART_EMPTY: 'CART_EMPTY',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  PAYMENT_ALREADY_PROCESSED: 'PAYMENT_ALREADY_PROCESSED',
  INVALID_WEBHOOK_SIGNATURE: 'INVALID_WEBHOOK_SIGNATURE',
  INVALID_REFRESH_TOKEN: 'INVALID_REFRESH_TOKEN',
  INVALID_RESET_TOKEN: 'INVALID_RESET_TOKEN',
  EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',
  EMAIL_EXISTS: 'EMAIL_EXISTS',
  LOW_STOCK: 'LOW_STOCK',
} as const;
