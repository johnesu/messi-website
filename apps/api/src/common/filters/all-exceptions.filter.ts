import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { AppError } from '../errors/app-error';

interface ErrorBody {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let body: ErrorBody = {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
    };

    if (exception instanceof AppError) {
      status = exception.statusCode;
      body = {
        success: false,
        error: {
          code: exception.code,
          message: exception.message,
          details: exception.details,
        },
      };
    } else if (exception instanceof ZodError) {
      status = HttpStatus.BAD_REQUEST;
      body = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: this.flattenZod(exception),
        },
      };
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      const message =
        typeof res === 'string' ? res : (res as Record<string, unknown>)?.message ?? exception.message;
      body = {
        success: false,
        error: {
          code: 'HTTP_ERROR',
          message: Array.isArray(message) ? message.join(', ') : String(message),
        },
      };
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      body = this.handlePrismaError(exception);
    }

    if (process.env.NODE_ENV !== 'production' && status >= 500) {
      body.error.details = {
        ...(body.error.details ?? {}),
        stack: exception instanceof Error ? exception.stack : undefined,
      };
    }

    response.status(status).json(body);
  }

  private flattenZod(error: ZodError): Record<string, unknown> {
    return error.issues.reduce<Record<string, unknown>>((acc, issue) => {
      const path = issue.path.join('.');
      acc[path] = issue.message;
      return acc;
    }, {});
  }

  private handlePrismaError(
    error: Prisma.PrismaClientKnownRequestError,
  ): ErrorBody {
    switch (error.code) {
      case 'P2002':
        return {
          success: false,
          error: {
            code: 'UNIQUE_CONSTRAINT',
            message: 'A record with this value already exists',
            details: { target: error.meta?.target },
          },
        };
      case 'P2003':
        return {
          success: false,
          error: {
            code: 'FOREIGN_KEY',
            message: 'Referenced record does not exist',
          },
        };
      case 'P2025':
        return {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Resource not found' },
        };
      default:
        return {
          success: false,
          error: { code: 'DATABASE_ERROR', message: 'Database operation failed' },
        };
    }
  }
}
