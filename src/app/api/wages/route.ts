import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateId } from '@/lib/format';
import { serialize, parseJson } from '@/lib/serialize';
import { validate, wageDistributionCreateSchema } from '@/lib/validation';
import { toErrorResponse, validationError } from '@/lib/api-error';
import type { WageDistribution, OperationalExpense, WageBreakdownItem } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const wds = await db.wageDistribution.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json({
      wageDistributions: wds.map(w => ({
        ...serialize(w),
        breakdown: parseJson<WageBreakdownItem[]>(w.breakdown, []),
        operationalExpenses: parseJson<OperationalExpense[]>(w.operationalExpenses, []),
      })) as WageDistribution[],
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const v = validate(wageDistributionCreateSchema, body);
    if (!v.ok) validationError(v.error, v.details);

    const data = v.data;
    const existing = await db.wageDistribution.findMany({ select: { id: true }, take: 1000 });
    const id = generateId('WD', existing.map(w => w.id));

    const wd = await db.wageDistribution.create({
      data: {
        id,
        jobId: data.jobId || null,
        grossAmount: data.grossAmount,
        distributableBase: data.distributableBase,
        totalPaid: data.totalPaid,
        breakdown: JSON.stringify(data.breakdown),
        operationalExpenses: JSON.stringify(data.operationalExpenses),
        notes: data.notes || '',
      },
    });

    return NextResponse.json({
      wageDistribution: {
        ...serialize(wd),
        breakdown: data.breakdown,
        operationalExpenses: data.operationalExpenses,
      },
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}
