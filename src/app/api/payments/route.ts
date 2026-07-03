import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateId } from '@/lib/format';
import { serialize } from '@/lib/serialize';
import type { Payment } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const payments = await db.payment.findMany({ orderBy: { paymentDate: 'desc' } });
  return NextResponse.json({ payments: payments.map(serialize) as Payment[] });
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const client = (body.client || '').trim();
  if (!client) return NextResponse.json({ error: 'Client is required' }, { status: 400 });
  const amount = Number(body.amount);
  if (!amount || amount <= 0) return NextResponse.json({ error: 'Amount must be > 0' }, { status: 400 });
  if (!body.paymentDate) return NextResponse.json({ error: 'Payment date is required' }, { status: 400 });

  const existing = await db.payment.findMany({ select: { id: true } });
  const id = generateId('PAY', existing.map(p => p.id));

  const jobId = body.jobId || null;
  const job = jobId ? await db.job.findUnique({ where: { id: jobId } }) : null;

  const payment = await db.payment.create({
    data: {
      id,
      jobId,
      client,
      paymentDate: new Date(body.paymentDate),
      amount,
      method: body.method || 'Cash',
      status: body.status || 'UNPAID',
      jobTotalFee: job ? job.totalFee : 0,
      jobBalance: job ? job.balance : 0,
      notes: body.notes || '',
    },
  });

  // Sync: reduce the job's balance by the payment amount (when PAID)
  if (job && body.status === 'PAID') {
    await db.job.update({
      where: { id: job.id },
      data: { balance: Math.max(0, (job.balance || 0) - amount) },
    });
  }

  return NextResponse.json({ payment: serialize(payment) });
}
