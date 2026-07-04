import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateId } from '@/lib/format';
import { serialize } from '@/lib/serialize';
import type { Task } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const tasks = await db.task.findMany({ orderBy: { dueDate: 'asc' } });
  return NextResponse.json({ tasks: tasks.map(serialize) as Task[] });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const client = (body.client || '').trim();
  if (!client) return NextResponse.json({ error: 'Client is required' }, { status: 400 });
  const taskName = (body.task || '').trim();
  if (!taskName) return NextResponse.json({ error: 'Task description is required' }, { status: 400 });
  if (!body.dueDate) return NextResponse.json({ error: 'Due date is required' }, { status: 400 });

  const existing = await db.task.findMany({ select: { id: true } });
  const id = generateId('TSK', existing.map(t => t.id));

  const task = await db.task.create({
    data: {
      id,
      jobId: body.jobId || null,
      client,
      task: taskName,
      dueDate: new Date(body.dueDate),
      status: body.status || 'OPEN',
      notes: body.notes || '',
    },
  });
  return NextResponse.json({ task: serialize(task) });
}
