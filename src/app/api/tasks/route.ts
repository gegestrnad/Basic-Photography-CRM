import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateId } from '@/lib/format';
import { serialize } from '@/lib/serialize';
import { validate, taskCreateSchema } from '@/lib/validation';
import { toErrorResponse, validationError } from '@/lib/api-error';
import type { Task } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const tasks = await db.task.findMany({ orderBy: { dueDate: 'asc' } });
    return NextResponse.json({ tasks: tasks.map(serialize) as Task[] });
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const v = validate(taskCreateSchema, body);
    if (!v.ok) validationError(v.error, v.details);

    const data = v.data;
    const existing = await db.task.findMany({ select: { id: true }, take: 1000 });
    const id = generateId('TSK', existing.map(t => t.id));

    const task = await db.task.create({
      data: {
        id,
        jobId: data.jobId || null,
        client: data.client,
        task: data.task,
        dueDate: new Date(data.dueDate),
        status: data.status,
        notes: data.notes || '',
      },
    });
    return NextResponse.json({ task: serialize(task) });
  } catch (err) {
    return toErrorResponse(err);
  }
}
