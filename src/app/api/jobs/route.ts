import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateId } from '@/lib/format';
import { fromDateInput } from '@/lib/format';
import { serialize } from '@/lib/serialize';
import type { Job } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const jobs = await db.job.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json({ jobs: jobs.map(serialize) as Job[] });
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  // Validation
  const client = (body.client || '').trim();
  if (!client || client.length < 2) {
    return NextResponse.json({ error: 'Client name is required' }, { status: 400 });
  }
  if (!body.jobDate) {
    return NextResponse.json({ error: 'Job date is required' }, { status: 400 });
  }

  const existing = await db.job.findMany({ select: { id: true } });
  const id = generateId('JOB', existing.map(j => j.id));

  const totalFee = Number(body.totalFee) || 0;
  const deposit = Number(body.deposit) || 0;
  const balance = body.balance != null ? Number(body.balance) : Math.max(0, totalFee - deposit);

  const job = await db.job.create({
    data: {
      id,
      client,
      phone: body.phone || '',
      jobType: body.jobType || 'Other',
      jobDate: new Date(body.jobDate),
      location: body.location || '',
      status: body.status || 'Inquiry',
      paymentStatus: body.paymentStatus || 'UNPAID',
      totalFee,
      deposit,
      balance,
      photographers: body.photographers || '',
      editors: body.editors || '',
      clientSource: body.clientSource || '',
      notes: body.notes || '',
    },
  });
  return NextResponse.json({ job: serialize(job) });
}
