import { describe, it, expect } from 'vitest';
import { toErrorResponse, ApiValidationError, validationError } from '@/lib/api-error';
import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';

describe('API error handler', () => {
  describe('toErrorResponse', () => {
    it('handles ApiValidationError → 400 with VALIDATION_ERROR code', async () => {
      const res = toErrorResponse(new ApiValidationError('Bad input', [{ path: 'client', message: 'required' }]));
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Bad input');
      expect(body.code).toBe('VALIDATION_ERROR');
      expect(body.details).toEqual([{ path: 'client', message: 'required' }]);
    });

    it('handles Prisma P2002 (unique constraint) → 409', async () => {
      const err = new Prisma.PrismaClientKnownRequestError('Duplicate', {
        code: 'P2002',
        clientVersion: '6.0.0',
        meta: { target: ['name'] },
      });
      const res = toErrorResponse(err);
      expect(res.status).toBe(409);
      const body = await res.json();
      expect(body.code).toBe('CONFLICT');
      expect(body.error).toContain('name');
    });

    it('handles Prisma P2025 (not found) → 404', async () => {
      const err = new Prisma.PrismaClientKnownRequestError('Not found', {
        code: 'P2025',
        clientVersion: '6.0.0',
      });
      const res = toErrorResponse(err);
      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.code).toBe('NOT_FOUND');
    });

    it('handles Prisma P2003 (FK constraint) → 400', async () => {
      const err = new Prisma.PrismaClientKnownRequestError('FK violation', {
        code: 'P2003',
        clientVersion: '6.0.0',
        meta: { field_name: 'jobId' },
      });
      const res = toErrorResponse(err);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.code).toBe('FK_CONSTRAINT');
      expect(body.error).toContain('jobId');
    });

    it('handles generic Error → 500', async () => {
      const res = toErrorResponse(new Error('Something went wrong'));
      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe('Something went wrong');
      expect(body.code).toBe('INTERNAL');
    });

    it('handles unknown errors → 500', async () => {
      const res = toErrorResponse('not even an error object');
      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.code).toBe('UNKNOWN');
    });
  });

  describe('validationError helper', () => {
    it('throws ApiValidationError', () => {
      expect(() => validationError('test message')).toThrow(ApiValidationError);
      expect(() => validationError('test message')).toThrow('test message');
    });

    it('attaches details', () => {
      try {
        validationError('msg', [{ field: 'x' }]);
        expect.fail('should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ApiValidationError);
        expect((e as ApiValidationError).details).toEqual([{ field: 'x' }]);
      }
    });
  });
});
