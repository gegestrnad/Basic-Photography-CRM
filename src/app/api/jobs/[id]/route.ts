import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { serialize } from '@/lib/serialize';
import type { Job, Payment, Task, WageDistribution } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const existing = await db.job.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

  const totalFee = body.totalFee != null ? Number(body.totalFee) : existing.totalFee;
  const deposit = body.deposit != null ? Number(body.deposit) : existing.deposit;
  const balance = body.balance != null
    ? Number(body.balance)
    : Math.max(0, totalFee - deposit);

  const job = await db.job.update({
    where: { id },
    data: {
      ...(body.client !== undefined && { client: String(body.client).trim() }),
      ...(body.phone !== undefined && { phone: body.phone }),
      ...(body.jobType !== undefined && { jobType: body.jobType }),
      ...(body.jobDate !== undefined && { jobDate: new Date(body.jobDate) }),
      ...(body.location !== undefined && { location: body.location }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.paymentStatus !== undefined && { paymentStatus: body.paymentStatus }),
      ...(body.totalFee !== undefined && { totalFee }),
      ...(body.deposit !== undefined && { deposit }),
      balance,
      ...(body.photographers !== undefined && { photographers: body.photographers }),
      ...(body.editors !== undefined && { editors: body.editors }),
      ...(body.clientSource !== undefined && { clientSource: body.clientSource }),
      ...(body.notes !== undefined && { notes: body.notes }),
    },
  });
  return NextResponse.json({ job: serialize(job) });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.payment.deleteMany({ where: { jobId: id } });
  await db.task.deleteMany({ where: { jobId: id } });
  await db.wageDistribution.deleteMany({ where: { jobId: id } });
  await db.job.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
