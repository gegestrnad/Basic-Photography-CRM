import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateId } from '@/lib/format';
import { serialize } from '@/lib/serialize';
import { validate, paymentCreateSchema } from '@/lib/validation';
import { toErrorResponse, validationError } from '@/lib/api-error';
import type { Payment } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const payments = await db.payment.findMany({ orderBy: { paymentDate: 'desc' } });
    return NextResponse.json({ payments: payments.map(serialize) as Payment[] });
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const v = validate(paymentCreateSchema, body);
    if (!v.ok) validationError(v.error, v.details);

    const data = v.data;
    const existing = await db.payment.findMany({ select: { id: true }, take: 1000 });
    const id = generateId('PAY', existing.map(p => p.id));

    const jobId = data.jobId || null;
    const job = jobId ? await db.job.findUnique({ where: { id: jobId } }) : null;

    const payment = await db.payment.create({
      data: {
        id,
        jobId,
        client: data.client,
        paymentDate: new Date(data.paymentDate),
        amount: data.amount,
        method: data.method,
        status: data.status,
        jobTotalFee: job ? job.totalFee : 0,
        jobBalance: job ? job.balance : 0,
        notes: data.notes || '',
      },
    });

    // Sync: reduce the job's balance by the payment amount (when PAID)
    if (job && data.status === 'PAID') {
      await db.job.update({
        where: { id: job.id },
        data: { balance: Math.max(0, (job.balance || 0) - data.amount) },
      });
    }

    return NextResponse.json({ payment: serialize(payment) });
  } catch (err) {
    return toErrorResponse(err);
  }
}
