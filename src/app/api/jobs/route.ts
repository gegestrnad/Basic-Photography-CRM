import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateId } from '@/lib/format';
import { serialize } from '@/lib/serialize';
import { validate, jobCreateSchema } from '@/lib/validation';
import { toErrorResponse, validationError } from '@/lib/api-error';
import type { Job } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const jobs = await db.job.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json({ jobs: jobs.map(serialize) as Job[] });
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const v = validate(jobCreateSchema, body);
    if (!v.ok) validationError(v.error, v.details);

    const data = v.data;
    const existing = await db.job.findMany({ select: { id: true }, take: 1000 });
    const id = generateId('JOB', existing.map(j => j.id));

    const totalFee = data.totalFee;
    const deposit = data.deposit;
    const balance = data.balance != null ? data.balance : Math.max(0, totalFee - deposit);

    const job = await db.job.create({
      data: {
        id,
        client: data.client,
        phone: data.phone || '',
        jobType: data.jobType,
        jobDate: new Date(data.jobDate),
        location: data.location || '',
        status: data.status,
        paymentStatus: data.paymentStatus,
        totalFee,
        deposit,
        balance,
        photographers: data.photographers || '',
        editors: data.editors || '',
        clientSource: data.clientSource || '',
        notes: data.notes || '',
      },
    });
    return NextResponse.json({ job: serialize(job) });
  } catch (err) {
    return toErrorResponse(err);
  }
}
