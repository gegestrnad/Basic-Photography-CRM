import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { serialize } from '@/lib/serialize';
import { validate, taskUpdateSchema } from '@/lib/validation';
import { toErrorResponse, validationError } from '@/lib/api-error';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const v = validate(taskUpdateSchema, body);
    if (!v.ok) validationError(v.error, v.details);

    const existing = await db.task.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

    const data = v.data;
    const task = await db.task.update({
      where: { id },
      data: {
        ...(data.client !== undefined && { client: data.client }),
        ...(data.jobId !== undefined && { jobId: data.jobId || null }),
        ...(data.task !== undefined && { task: data.task }),
        ...(data.dueDate !== undefined && { dueDate: new Date(data.dueDate) }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.notes !== undefined && { notes: data.notes || '' }),
      },
    });
    return NextResponse.json({ task: serialize(task) });
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.task.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return toErrorResponse(err);
  }
}
