import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { serialize } from '@/lib/serialize';
import { validate, clientCreateSchema } from '@/lib/validation';
import { toErrorResponse, validationError } from '@/lib/api-error';
import type { Client } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const clients = await db.client.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { jobs: true } },
      },
    });
    return NextResponse.json({
      clients: clients.map(c => ({
        ...serialize(c),
        jobCount: c._count.jobs,
      })) as (Client & { jobCount: number })[],
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const v = validate(clientCreateSchema, body);
    if (!v.ok) validationError(v.error, v.details);

    const data = v.data;
    const client = await db.client.create({
      data: {
        name: data.name,
        phone: data.phone || '',
        email: data.email || '',
        notes: data.notes || '',
      },
    });
    return NextResponse.json({ client: serialize(client) });
  } catch (err) {
    return toErrorResponse(err);
  }
}
