import { describe, it, expect } from 'vitest';
import {
  jobCreateSchema,
  paymentCreateSchema,
  taskCreateSchema,
  wageDistributionCreateSchema,
  settingsUpdateSchema,
  validate,
} from '@/lib/validation';

describe('Zod validation schemas', () => {
  describe('jobCreateSchema', () => {
    it('accepts a valid job', () => {
      const result = validate(jobCreateSchema, {
        client: 'Test Client',
        jobType: 'Wedding',
        jobDate: '2026-07-15',
      });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.client).toBe('Test Client');
        expect(result.data.status).toBe('Inquiry');
        expect(result.data.paymentStatus).toBe('UNPAID');
      }
    });

    it('rejects client name shorter than 2 chars', () => {
      const result = validate(jobCreateSchema, {
        client: 'A',
        jobType: 'Wedding',
        jobDate: '2026-07-15',
      });
      expect(result.ok).toBe(false);
    });

    it('rejects invalid jobDate', () => {
      const result = validate(jobCreateSchema, {
        client: 'Test',
        jobType: 'Wedding',
        jobDate: 'not-a-date',
      });
      expect(result.ok).toBe(false);
    });

    it('rejects negative totalFee', () => {
      const result = validate(jobCreateSchema, {
        client: 'Test',
        jobType: 'Wedding',
        jobDate: '2026-07-15',
        totalFee: -100,
      });
      expect(result.ok).toBe(false);
    });

    it('applies defaults for optional fields', () => {
      const result = validate(jobCreateSchema, {
        client: 'Test',
        jobType: 'Wedding',
        jobDate: '2026-07-15',
      });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.deposit).toBe(0);
        expect(result.data.location).toBe('');
        expect(result.data.notes).toBe('');
      }
    });
  });

  describe('paymentCreateSchema', () => {
    it('accepts a valid payment', () => {
      const result = validate(paymentCreateSchema, {
        client: 'Test Client',
        paymentDate: '2026-07-15',
        amount: 500000,
      });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.method).toBe('Cash');
        expect(result.data.status).toBe('UNPAID');
      }
    });

    it('rejects zero amount', () => {
      const result = validate(paymentCreateSchema, {
        client: 'Test',
        paymentDate: '2026-07-15',
        amount: 0,
      });
      expect(result.ok).toBe(false);
    });

    it('rejects negative amount', () => {
      const result = validate(paymentCreateSchema, {
        client: 'Test',
        paymentDate: '2026-07-15',
        amount: -100,
      });
      expect(result.ok).toBe(false);
    });

    it('rejects empty client', () => {
      const result = validate(paymentCreateSchema, {
        client: '',
        paymentDate: '2026-07-15',
        amount: 500,
      });
      expect(result.ok).toBe(false);
    });
  });

  describe('taskCreateSchema', () => {
    it('accepts a valid task', () => {
      const result = validate(taskCreateSchema, {
        client: 'Test',
        task: 'Edit photos',
        dueDate: '2026-07-20',
      });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.status).toBe('OPEN');
      }
    });

    it('rejects empty task description', () => {
      const result = validate(taskCreateSchema, {
        client: 'Test',
        task: '',
        dueDate: '2026-07-20',
      });
      expect(result.ok).toBe(false);
    });
  });

  describe('wageDistributionCreateSchema', () => {
    it('accepts a valid distribution', () => {
      const result = validate(wageDistributionCreateSchema, {
        jobId: 'JOB-0001',
        grossAmount: 1600000,
        distributableBase: 1000000,
        totalPaid: 1600000,
        breakdown: [
          { staffName: 'Gege', roles: ['Photographer A'], percentage: 0.3, amount: 300000 },
        ],
        operationalExpenses: [
          { name: 'Printing', amount: 450000 },
        ],
      });
      expect(result.ok).toBe(true);
    });

    it('rejects zero distributableBase', () => {
      const result = validate(wageDistributionCreateSchema, {
        grossAmount: 1000,
        distributableBase: 0,
        breakdown: [],
        operationalExpenses: [],
      });
      expect(result.ok).toBe(false);
    });

    it('rejects percentage > 1', () => {
      const result = validate(wageDistributionCreateSchema, {
        grossAmount: 1000,
        distributableBase: 500,
        breakdown: [
          { staffName: 'X', roles: ['Y'], percentage: 1.5, amount: 750 },
        ],
        operationalExpenses: [],
      });
      expect(result.ok).toBe(false);
    });
  });

  describe('settingsUpdateSchema', () => {
    it('accepts partial settings (strict mode)', () => {
      const result = validate(settingsUpdateSchema, {
        wageRules: [{ role: 'Photographer A', percentage: 0.3 }],
      });
      expect(result.ok).toBe(true);
    });

    it('rejects unknown keys (strict mode)', () => {
      const result = validate(settingsUpdateSchema, {
        maliciousField: 'hack',
      });
      expect(result.ok).toBe(false);
    });
  });
});
