import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { serialize } from '@/lib/serialize';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const existing = await db.payment.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: 'Payment not found' }, { status: 404 });

  const newAmount = body.amount != null ? Number(body.amount) : existing.amount;
  const newStatus = body.status ?? existing.status;
  const newJobId = body.jobId !== undefined ? (body.jobId || null) : existing.jobId;

  // Re-sync the old job's balance: restore old amount if old status was PAID
  if (existing.jobId && existing.status === 'PAID') {
    const oldJob = await db.job.findUnique({ where: { id: existing.jobId } });
    if (oldJob) {
      await db.job.update({
        where: { id: oldJob.id },
        data: { balance: (oldJob.balance || 0) + existing.amount },
      });
    }
  }

  // Apply new amount to the new job if status is PAID
  if (newJobId && newStatus === 'PAID') {
    const newJob = await db.job.findUnique({ where: { id: newJobId } });
    if (newJob) {
      await db.job.update({
        where: { id: newJob.id },
        data: { balance: Math.max(0, (newJob.balance || 0) - newAmount) },
      });
    }
  }

  const payment = await db.payment.update({
    where: { id },
    data: {
      ...(body.client !== undefined && { client: String(body.client).trim() }),
      ...(body.jobId !== undefined && { jobId: body.jobId || null }),
      ...(body.paymentDate !== undefined && { paymentDate: new Date(body.paymentDate) }),
      amount: newAmount,
      ...(body.method !== undefined && { method: body.method }),
      status: newStatus,
      ...(body.notes !== undefined && { notes: body.notes }),
      // Refresh snapshot
      ...(newJobId && {
        jobTotalFee: (await db.job.findUnique({ where: { id: newJobId } }))?.totalFee || 0,
        jobBalance: (await db.job.findUnique({ where: { id: newJobId } }))?.balance || 0,
      }),
    },
  });
  return NextResponse.json({ payment: serialize(payment) });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const payment = await db.payment.findUnique({ where: { id } });
  if (!payment) return NextResponse.json({ error: 'Payment not found' }, { status: 404 });

  // Restore job balance if it was PAID
  if (payment.jobId && payment.status === 'PAID') {
    const job = await db.job.findUnique({ where: { id: payment.jobId } });
    if (job) {
      await db.job.update({
        where: { id: job.id },
        data: { balance: (job.balance || 0) + payment.amount },
      });
    }
  }

  await db.payment.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
