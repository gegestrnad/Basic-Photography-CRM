import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { computeWageBreakdown } from '@/lib/format';
import { parseJson } from '@/lib/serialize';
import type { OperationalExpense, WageRule, Staff, WageCalculationResult } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/wages/calculate?jobId=JOB-0001
 * Returns a wage calculation result for the given job.
 *
 * Logic (matching the original Excel "Wage Dist.xlsx" sheet):
 *   grossAmount        = sum of PAID payments for this job (or 0)
 *   operationalExpenses = WageConfig.defaultExpenses (editable on client)
 *   distributableBase  = grossAmount - sum(operationalExpenses)
 *                      (falls back to grossAmount * distributableRatio if expenses are all 0
 *                       OR if distributableBase would be negative — preserves legacy behavior)
 *   breakdown          = per-staff amount = sum(staff's role percentages) * distributableBase
 *   totalCheck         = sum(breakdown amounts) — should equal distributableBase
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get('jobId');

  let grossAmount = 0;
  let totalPaid = 0;

  if (jobId) {
    const job = await db.job.findUnique({ where: { id: jobId } });
    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

    const payments = await db.payment.findMany({ where: { jobId } });
    totalPaid = payments
      .filter(p => p.status === 'PAID')
      .reduce((sum, p) => sum + p.amount, 0);
    grossAmount = totalPaid;
  } else {
    // Allow manual gross via query param
    grossAmount = Number(searchParams.get('gross')) || 0;
  }

  // Load wage rules + staff + config
  const rules = await db.wageRule.findMany({ orderBy: { sortOrder: 'asc' } });
  const staff = await db.staff.findMany({ orderBy: { sortOrder: 'asc' } });
  const configRow = await db.wageConfig.findUnique({ where: { id: 'singleton' } });
  const config = configRow || { distributableRatio: 0.625, defaultExpenses: '[]' };

  const operationalExpenses: OperationalExpense[] = parseJson<OperationalExpense[]>(
    config.defaultExpenses,
    []
  );

  const totalExpenses = operationalExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);

  // Compute distributable base
  let distributableBase: number;
  if (totalExpenses > 0) {
    // Real formula: gross - expenses
    distributableBase = Math.max(0, grossAmount - totalExpenses);
  } else if (grossAmount > 0) {
    // Legacy fallback: gross * ratio
    distributableBase = Math.round(grossAmount * config.distributableRatio);
  } else {
    distributableBase = 0;
  }

  // Compute breakdown
  const { breakdown, totalCheck, isVerified } = computeWageBreakdown(
    distributableBase,
    rules as WageRule[],
    staff.map(s => ({ name: s.name, roles: parseJson<string[]>(s.roles, []) }))
  );

  const result: WageCalculationResult = {
    jobId,
    grossAmount,
    totalPaid,
    operationalExpenses,
    totalExpenses,
    distributableBase,
    breakdown: breakdown.map(b => ({
      staffName: b.staffName,
      role: staff.find(s => s.name === b.staffName)?.primaryRole || '',
      roles: b.roles,
      percentage: b.percentage,
      amount: b.amount,
    })),
    totalCheck,
    isVerified,
  };

  return NextResponse.json({ result });
}
