// Centralized Zod validation schemas for all API endpoints
import { z } from 'zod';

// ── Clients ───────────────────────────────────────────────────
export const clientCreateSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(200),
  phone: z.string().max(50).optional().nullable().default(''),
  email: z.string().email('Invalid email').optional().nullable().or(z.literal('')).default(''),
  notes: z.string().max(5000).optional().nullable().default(''),
});

export const clientUpdateSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  phone: z.string().max(50).optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')).optional(),
  notes: z.string().max(5000).optional().nullable(),
}).strict();

// ── Jobs ──────────────────────────────────────────────────────
export const jobCreateSchema = z.object({
  client: z.string().trim().min(2, 'Client name must be at least 2 characters').max(200),
  phone: z.string().max(50).optional().nullable().default(''),
  jobType: z.string().min(1).max(100).default('Other'),
  jobDate: z.string().refine((v) => !isNaN(Date.parse(v)), 'Invalid jobDate'),
  location: z.string().max(500).optional().nullable().default(''),
  status: z.string().min(1).max(50).default('Inquiry'),
  paymentStatus: z.string().min(1).max(50).default('UNPAID'),
  totalFee: z.number().int().min(0).max(1_000_000_000).default(0),
  deposit: z.number().int().min(0).max(1_000_000_000).default(0),
  balance: z.number().int().min(0).max(1_000_000_000).optional(),
  photographers: z.string().max(500).optional().nullable().default(''),
  editors: z.string().max(500).optional().nullable().default(''),
  clientSource: z.string().max(100).optional().nullable().default(''),
  notes: z.string().max(5000).optional().nullable().default(''),
});

export const jobUpdateSchema = z.object({
  client: z.string().trim().min(2).max(200).optional(),
  phone: z.string().max(50).optional().nullable(),
  jobType: z.string().min(1).max(100).optional(),
  jobDate: z.string().refine((v) => !isNaN(Date.parse(v))).optional(),
  location: z.string().max(500).optional().nullable(),
  status: z.string().min(1).max(50).optional(),
  paymentStatus: z.string().min(1).max(50).optional(),
  totalFee: z.number().int().min(0).max(1_000_000_000).optional(),
  deposit: z.number().int().min(0).max(1_000_000_000).optional(),
  balance: z.number().int().min(0).max(1_000_000_000).optional(),
  photographers: z.string().max(500).optional().nullable(),
  editors: z.string().max(500).optional().nullable(),
  clientSource: z.string().max(100).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
}).strict();

// ── Payments ──────────────────────────────────────────────────
export const paymentCreateSchema = z.object({
  jobId: z.string().max(50).optional().nullable().default(null),
  client: z.string().trim().min(1, 'Client is required').max(200),
  paymentDate: z.string().refine((v) => !isNaN(Date.parse(v)), 'Invalid paymentDate'),
  amount: z.number().int().positive('Amount must be greater than 0').max(1_000_000_000),
  method: z.string().min(1).max(50).default('Cash'),
  status: z.string().min(1).max(50).default('UNPAID'),
  notes: z.string().max(5000).optional().nullable().default(''),
});

export const paymentUpdateSchema = z.object({
  jobId: z.string().max(50).optional().nullable(),
  client: z.string().trim().min(1).max(200).optional(),
  paymentDate: z.string().refine((v) => !isNaN(Date.parse(v))).optional(),
  amount: z.number().int().positive().max(1_000_000_000).optional(),
  method: z.string().min(1).max(50).optional(),
  status: z.string().min(1).max(50).optional(),
  notes: z.string().max(5000).optional().nullable(),
}).strict();

// ── Tasks ─────────────────────────────────────────────────────
export const taskCreateSchema = z.object({
  jobId: z.string().max(50).optional().nullable().default(null),
  client: z.string().trim().min(1, 'Client is required').max(200),
  task: z.string().trim().min(1, 'Task description is required').max(500),
  dueDate: z.string().refine((v) => !isNaN(Date.parse(v)), 'Invalid dueDate'),
  status: z.string().min(1).max(50).default('OPEN'),
  notes: z.string().max(5000).optional().nullable().default(''),
});

export const taskUpdateSchema = z.object({
  jobId: z.string().max(50).optional().nullable(),
  client: z.string().trim().min(1).max(200).optional(),
  task: z.string().trim().min(1).max(500).optional(),
  dueDate: z.string().refine((v) => !isNaN(Date.parse(v))).optional(),
  status: z.string().min(1).max(50).optional(),
  notes: z.string().max(5000).optional().nullable(),
}).strict();

// ── Wages ─────────────────────────────────────────────────────
export const wageBreakdownItemSchema = z.object({
  staffName: z.string().min(1).max(200),
  role: z.string().max(200).optional().default(''),
  roles: z.array(z.string()).default([]),
  percentage: z.number().min(0).max(1),
  amount: z.number().int().min(0),
});

export const operationalExpenseSchema = z.object({
  name: z.string().min(1).max(200),
  amount: z.number().int().min(0).max(1_000_000_000),
});

export const wageDistributionCreateSchema = z.object({
  jobId: z.string().max(50).optional().nullable().default(null),
  grossAmount: z.number().int().min(0).max(1_000_000_000).default(0),
  distributableBase: z.number().int().positive('Distributable base must be > 0').max(1_000_000_000),
  totalPaid: z.number().int().min(0).max(1_000_000_000).default(0),
  breakdown: z.array(wageBreakdownItemSchema).default([]),
  operationalExpenses: z.array(operationalExpenseSchema).default([]),
  notes: z.string().max(5000).optional().nullable().default(''),
});

// ── Settings ──────────────────────────────────────────────────
export const wageRuleSchema = z.object({
  role: z.string().min(1).max(200),
  percentage: z.number().min(0).max(1),
});

export const staffSchema = z.object({
  name: z.string().min(1).max(200),
  primaryRole: z.string().max(200).optional().default(''),
  phone: z.string().max(50).optional().default(''),
  notes: z.string().max(2000).optional().default(''),
  roles: z.array(z.string()).default([]),
});

export const wageConfigSchema = z.object({
  distributableRatio: z.number().min(0).max(1).default(0.625),
  defaultExpenses: z.array(operationalExpenseSchema).default([]),
});

export const settingsUpdateSchema = z.object({
  lists: z.object({
    jobStatuses: z.array(z.string()).optional(),
    paymentStatuses: z.array(z.string()).optional(),
    clientSources: z.array(z.string()).optional(),
    jobTypes: z.array(z.string()).optional(),
    taskStatuses: z.array(z.string()).optional(),
    paymentMethods: z.array(z.string()).optional(),
  }).optional(),
  wageRules: z.array(wageRuleSchema).optional(),
  staff: z.array(staffSchema).optional(),
  wageConfig: wageConfigSchema.optional(),
}).strict();

// ── Backup Import ─────────────────────────────────────────────
export const backupImportSchema = z.object({
  jobs: z.array(z.any()).min(0),
  payments: z.array(z.any()).min(0),
  tasks: z.array(z.any()).min(0),
  wageDistributions: z.array(z.any()).optional().default([]),
  staff: z.array(z.any()).optional().default([]),
  wageRules: z.array(z.any()).optional().default([]),
  wageConfig: z.any().optional(),
  lists: z.record(z.array(z.string())).optional(),
});

// ── Users (Admin) ─────────────────────────────────────────────
export const userCreateSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(200),
  email: z.string().trim().toLowerCase().email('A valid email is required').max(200),
  password: z.string().min(6, 'Password must be at least 6 characters').max(200),
  role: z.enum(['admin', 'user']).default('user'),
});

export const userUpdateSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  email: z.string().trim().toLowerCase().email().max(200).optional(),
  password: z.string().min(6).max(200).optional().nullable(),
  role: z.enum(['admin', 'user']).optional(),
}).strict();

// ── Helpers ───────────────────────────────────────────────────
export type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; details: any };

export function validate<T>(schema: z.ZodType<T>, input: unknown): ValidationResult<T> {
  const result = schema.safeParse(input);
  if (result.success) {
    return { ok: true, data: result.data };
  }
  // Flatten Zod errors into a friendly list
  const details = result.error.issues.map((iss) => ({
    path: iss.path.join('.'),
    message: iss.message,
  }));
  return {
    ok: false,
    error: 'Validation failed: ' + details.map(d => `${d.path || 'root'} (${d.message})`).join('; '),
    details,
  };
}
