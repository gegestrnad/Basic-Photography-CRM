import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { serialize } from '@/lib/serialize';
import { validate, clientUpdateSchema } from '@/lib/validation';
import { toErrorResponse, validationError } from '@/lib/api-error';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const v = validate(clientUpdateSchema, body);
    if (!v.ok) validationError(v.error, v.details);

    const existing = await db.client.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

    const data = v.data;
    const client = await db.client.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.phone !== undefined && { phone: data.phone || '' }),
        ...(data.email !== undefined && { email: data.email || '' }),
        ...(data.notes !== undefined && { notes: data.notes || '' }),
      },
    });
    return NextResponse.json({ client: serialize(client) });
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    // Unlink jobs from this client (set clientId to null) before deleting
    await db.job.updateMany({ where: { clientId: id }, data: { clientId: null } });
    await db.client.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return toErrorResponse(err);
  }
}
