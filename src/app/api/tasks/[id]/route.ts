import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { serialize } from '@/lib/serialize';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const existing = await db.task.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

  const task = await db.task.update({
    where: { id },
    data: {
      ...(body.client !== undefined && { client: String(body.client).trim() }),
      ...(body.jobId !== undefined && { jobId: body.jobId || null }),
      ...(body.task !== undefined && { task: String(body.task).trim() }),
      ...(body.dueDate !== undefined && { dueDate: new Date(body.dueDate) }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.notes !== undefined && { notes: body.notes }),
    },
  });
  return NextResponse.json({ task: serialize(task) });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.task.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
