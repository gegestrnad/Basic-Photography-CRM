import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { serialize } from '@/lib/serialize';
import { validate, paymentUpdateSchema } from '@/lib/validation';
import { toErrorResponse, validationError } from '@/lib/api-error';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const v = validate(paymentUpdateSchema, body);
    if (!v.ok) validationError(v.error, v.details);

    const existing = await db.payment.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Payment not found' }, { status: 404 });

    const data = v.data;
    const newAmount = data.amount != null ? data.amount : existing.amount;
    const newStatus = data.status ?? existing.status;
    const newJobId = data.jobId !== undefined ? (data.jobId || null) : existing.jobId;

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

    const updatedJob = newJobId ? await db.job.findUnique({ where: { id: newJobId } }) : null;
    const payment = await db.payment.update({
      where: { id },
      data: {
        ...(data.client !== undefined && { client: data.client }),
        ...(data.jobId !== undefined && { jobId: data.jobId || null }),
        ...(data.paymentDate !== undefined && { paymentDate: new Date(data.paymentDate) }),
        amount: newAmount,
        ...(data.method !== undefined && { method: data.method }),
        status: newStatus,
        ...(data.notes !== undefined && { notes: data.notes || '' }),
        // Refresh snapshot
        ...(updatedJob && {
          jobTotalFee: updatedJob.totalFee,
          jobBalance: updatedJob.balance,
        }),
      },
    });
    return NextResponse.json({ payment: serialize(payment) });
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
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
  } catch (err) {
    return toErrorResponse(err);
  }
}
