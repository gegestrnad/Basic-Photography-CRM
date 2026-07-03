import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateId, computeWageBreakdown } from '@/lib/format';
import { serialize, parseJson } from '@/lib/serialize';
import type { WageDistribution, OperationalExpense, WageBreakdownItem } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const wds = await db.wageDistribution.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json({
    wageDistributions: wds.map(w => ({
      ...serialize(w),
      breakdown: parseJson<WageBreakdownItem[]>(w.breakdown, []),
      operationalExpenses: parseJson<OperationalExpense[]>(w.operationalExpenses, []),
    })) as WageDistribution[],
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  // Required: grossAmount, distributableBase, breakdown, operationalExpenses
  const grossAmount = Number(body.grossAmount) || 0;
  const distributableBase = Number(body.distributableBase) || 0;
  if (distributableBase <= 0) {
    return NextResponse.json({ error: 'Distributable base must be > 0' }, { status: 400 });
  }
  const breakdown: WageBreakdownItem[] = Array.isArray(body.breakdown) ? body.breakdown : [];
  const operationalExpenses: OperationalExpense[] = Array.isArray(body.operationalExpenses) ? body.operationalExpenses : [];

  const existing = await db.wageDistribution.findMany({ select: { id: true } });
  const id = generateId('WD', existing.map(w => w.id));

  const wd = await db.wageDistribution.create({
    data: {
      id,
      jobId: body.jobId || null,
      grossAmount,
      distributableBase,
      totalPaid: Number(body.totalPaid) || 0,
      breakdown: JSON.stringify(breakdown),
      operationalExpenses: JSON.stringify(operationalExpenses),
      notes: body.notes || '',
    },
  });

  return NextResponse.json({
    wageDistribution: {
      ...serialize(wd),
      breakdown,
      operationalExpenses,
    },
  });
}
