import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { serialize } from '@/lib/serialize';
import { validate, userUpdateSchema } from '@/lib/validation';
import { toErrorResponse, validationError } from '@/lib/api-error';
import { requireAdmin } from '@/lib/auth-guard';
import type { User } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user: currentUser, response } = await requireAdmin();
    if (response) return response;

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const v = validate(userUpdateSchema, body);
    if (!v.ok) validationError(v.error, v.details);

    const data = v.data;

    // Verify the target user exists
    const target = await db.user.findUnique({ where: { id } });
    if (!target) {
      return NextResponse.json({ error: 'User not found', code: 'NOT_FOUND' }, { status: 404 });
    }

    // If email is changing, ensure no conflict
    if (data.email && data.email !== target.email) {
      const conflict = await db.user.findUnique({ where: { email: data.email } });
      if (conflict) {
        return NextResponse.json({ error: 'This email is already registered', code: 'EMAIL_TAKEN' }, { status: 409 });
      }
    }

    // Demotion safety: don't allow demoting the last admin to user
    if (target.role === 'admin' && data.role === 'user') {
      const adminCount = await db.user.count({ where: { role: 'admin' } });
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot demote the last admin account', code: 'LAST_ADMIN' },
          { status: 400 }
        );
      }
    }

    // Build the update payload — only include provided fields
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    const updated = await db.user.update({ where: { id }, data: updateData });
    const { password: _pw, ...safeUser } = updated;
    return NextResponse.json({ user: serialize(safeUser) as User });
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user: currentUser, response } = await requireAdmin();
    if (response) return response;

    const { id } = await params;

    const target = await db.user.findUnique({ where: { id } });
    if (!target) {
      return NextResponse.json({ error: 'User not found', code: 'NOT_FOUND' }, { status: 404 });
    }

    // Cannot delete yourself
    if (target.id === currentUser!.id) {
      return NextResponse.json(
        { error: 'You cannot delete your own account', code: 'CANNOT_DELETE_SELF' },
        { status: 400 }
      );
    }

    // Cannot delete the last admin
    if (target.role === 'admin') {
      const adminCount = await db.user.count({ where: { role: 'admin' } });
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot delete the last admin account', code: 'LAST_ADMIN' },
          { status: 400 }
        );
      }
    }

    await db.user.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return toErrorResponse(err);
  }
}
