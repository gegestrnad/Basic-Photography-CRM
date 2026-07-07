// Global API error handler — wraps route handlers and returns clean JSON errors
import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

export interface ApiError {
  error: string;
  details?: any;
  code?: string;
}

/** Convert any caught error into a clean JSON response (never throws) */
export function toErrorResponse(err: unknown): NextResponse<ApiError> {
  // Zod validation errors (passed through from validate())
  if (err instanceof ApiValidationError) {
    return NextResponse.json(
      { error: err.message, details: err.details, code: 'VALIDATION_ERROR' },
      { status: 400 }
    );
  }

  // Prisma known errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      // Unique constraint violation
      const target = (err.meta?.target as string[] | undefined)?.join(', ') || 'field';
      return NextResponse.json(
        { error: `Duplicate value for: ${target}`, code: 'CONFLICT' },
        { status: 409 }
      );
    }
    if (err.code === 'P2025') {
      // Record not found
      return NextResponse.json(
        { error: 'Record not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }
    if (err.code === 'P2003') {
      // Foreign key constraint
      const field = (err.meta?.field_name as string | undefined) || 'foreign key';
      return NextResponse.json(
        { error: `Referenced record does not exist: ${field}`, code: 'FK_CONSTRAINT' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: `Database error: ${err.code}`, details: err.message, code: 'DB_ERROR' },
      { status: 400 }
    );
  }

  // Network / connection errors
  if (err instanceof Prisma.PrismaClientInitializationError) {
    return NextResponse.json(
      { error: 'Database connection failed', code: 'DB_INIT' },
      { status: 503 }
    );
  }

  // Standard Error
  if (err instanceof Error) {
    // Don't leak internal stack traces in production
    return NextResponse.json(
      { error: err.message || 'Internal server error', code: 'INTERNAL' },
      { status: 500 }
    );
  }

  // Unknown
  return NextResponse.json(
    { error: 'Unknown server error', code: 'UNKNOWN' },
    { status: 500 }
  );
}

/** Custom validation error class for easy throwing */
export class ApiValidationError extends Error {
  details: any;
  constructor(message: string, details?: any) {
    super(message);
    this.name = 'ApiValidationError';
    this.details = details;
  }
}

/** Helper: throw a validation error from a ValidationResult-like failure */
export function validationError(message: string, details?: any): never {
  throw new ApiValidationError(message, details);
}

/** Wrap a route handler with global error catching */
export function withErrorHandler<TArgs extends any[]>(
  handler: (...args: TArgs) => Promise<NextResponse>
): (...args: TArgs) => Promise<NextResponse> {
  return async (...args: TArgs) => {
    try {
      return await handler(...args);
    } catch (err) {
      console.error('[API Error]', err);
      return toErrorResponse(err);
    }
  };
}
