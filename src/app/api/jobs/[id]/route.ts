import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { serialize } from '@/lib/serialize';
import { validate, jobUpdateSchema } from '@/lib/validation';
import { toErrorResponse, validationError } from '@/lib/api-error';
import type { Job, Payment, Task, WageDistribution } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const job = await db.job.findUnique({
      where: { id },
      include: {
        payments: { orderBy: { paymentDate: 'asc' } },
        tasks: { orderBy: { dueDate: 'asc' } },
        wageDistributions: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    return NextResponse.json({
      job: serialize(job) as Job,
      payments: job.payments.map(serialize) as Payment[],
      tasks: job.tasks.map(serialize) as Task[],
      wageDistributions: job.wageDistributions.map(serialize) as WageDistribution[],
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const v = validate(jobUpdateSchema, body);
    if (!v.ok) validationError(v.error, v.details);

    const existing = await db.job.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

    const data = v.data;
    const totalFee = data.totalFee != null ? data.totalFee : existing.totalFee;
    const deposit = data.deposit != null ? data.deposit : existing.deposit;
    const balance = data.balance != null
      ? data.balance
      : Math.max(0, totalFee - deposit);

    const job = await db.job.update({
      where: { id },
      data: {
        ...(data.client !== undefined && { client: data.client }),
        ...(data.phone !== undefined && { phone: data.phone || '' }),
        ...(data.jobType !== undefined && { jobType: data.jobType }),
        ...(data.jobDate !== undefined && { jobDate: new Date(data.jobDate) }),
        ...(data.location !== undefined && { location: data.location || '' }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.paymentStatus !== undefined && { paymentStatus: data.paymentStatus }),
        ...(data.totalFee !== undefined && { totalFee }),
        ...(data.deposit !== undefined && { deposit }),
        balance,
        ...(data.photographers !== undefined && { photographers: data.photographers || '' }),
        ...(data.editors !== undefined && { editors: data.editors || '' }),
        ...(data.clientSource !== undefined && { clientSource: data.clientSource || '' }),
        ...(data.notes !== undefined && { notes: data.notes || '' }),
      },
    });
    return NextResponse.json({ job: serialize(job) });
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.payment.deleteMany({ where: { jobId: id } });
    await db.task.deleteMany({ where: { jobId: id } });
    await db.wageDistribution.deleteMany({ where: { jobId: id } });
    await db.job.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return toErrorResponse(err);
  }
}
