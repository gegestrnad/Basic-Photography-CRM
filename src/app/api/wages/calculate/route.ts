import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { toErrorResponse } from '@/lib/api-error';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/wages/calculate?jobId=JOB-0001
 * Returns a wage calculation result for the given job.
 */
export async function GET(req: NextRequest) {
  try {
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
      grossAmount = Number(searchParams.get('gross')) || 0;
    }

    // Load wage rules + staff + config
    const rules = await db.wageRule.findMany({ orderBy: { sortOrder: 'asc' } });
    const staff = await db.staff.findMany({ orderBy: { sortOrder: 'asc' } });
    const configRow = await db.wageConfig.findUnique({ where: { id: 'singleton' } });
    const config = configRow || { distributableRatio: 0.625, defaultExpenses: '[]' };

    const operationalExpenses = parseJsonSafe(config.defaultExpenses, []);

    const totalExpenses = operationalExpenses.reduce((s: number, e: any) => s + (Number(e.amount) || 0), 0);

    let distributableBase: number;
    if (totalExpenses > 0) {
      distributableBase = Math.max(0, grossAmount - totalExpenses);
    } else if (grossAmount > 0) {
      distributableBase = Math.round(grossAmount * config.distributableRatio);
    } else {
      distributableBase = 0;
    }

    // Compute breakdown
    const { breakdown, totalCheck, isVerified } = computeWageBreakdown(
      distributableBase,
      rules,
      staff
    );

    const result = {
      jobId,
      grossAmount,
      totalPaid,
      operationalExpenses,
      totalExpenses,
      distributableBase,
      breakdown: breakdown.map((b: any) => ({
        staffName: b.staffName,
        role: staff.find((s: any) => s.name === b.staffName)?.primaryRole || '',
        roles: b.roles,
        percentage: b.percentage,
        amount: b.amount,
      })),
      totalCheck,
      isVerified,
    };

    return NextResponse.json({ result });
  } catch (err) {
    return toErrorResponse(err);
  }
}

function parseJsonSafe<T>(str: string | null | undefined, fallback: T): T {
  if (!str) return fallback;
  try { return JSON.parse(str) as T; } catch { return fallback; }
}

function computeWageBreakdown(base: number, rules: any[], staff: any[]) {
  const breakdown: { staffName: string; roles: string[]; percentage: number; amount: number }[] = [];
  staff.forEach((s: any) => {
    const sRoles: string[] = parseJsonSafe(s.roles, []);
    if (!sRoles || sRoles.length === 0) return;
    let staffPct = 0;
    sRoles.forEach((r: string) => {
      const rule = rules.find((rl: any) => rl.role === r);
      if (rule) staffPct += rule.percentage;
    });
    if (staffPct === 0) return;
    breakdown.push({
      staffName: s.name,
      roles: sRoles,
      percentage: staffPct,
      amount: Math.round(base * staffPct),
    });
  });

  const sum = breakdown.reduce((acc, b) => acc + b.amount, 0);
  const diff = base - sum;
  if (diff !== 0 && breakdown.length > 0) {
    breakdown.sort((a, b) => b.amount - a.amount);
    breakdown[0].amount += diff;
  }
  const totalCheck = breakdown.reduce((acc, b) => acc + b.amount, 0);
  return {
    breakdown,
    totalCheck,
    isVerified: totalCheck === base,
  };
}
