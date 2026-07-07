import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { serialize } from '@/lib/serialize';
import { validate, userCreateSchema } from '@/lib/validation';
import { toErrorResponse, validationError } from '@/lib/api-error';
import type { User } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** Require an authenticated admin user; returns the user record or a 401/403 response. */
export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return {
      user: null,
      response: NextResponse.json({ error: 'Authentication required' }, { status: 401 }),
    };
  }
  // Fetch the live user record so role checks reflect the current DB state
  const dbUser = await db.user.findUnique({ where: { email: (session.user as any).email } });
  if (!dbUser || dbUser.role !== 'admin') {
    return {
      user: null,
      response: NextResponse.json({ error: 'Admin access required' }, { status: 403 }),
    };
  }
  return { user: dbUser, response: null };
}

export async function GET() {
  try {
    const { response } = await requireAdmin();
    if (response) return response;

    const users = await db.user.findMany({ orderBy: { createdAt: 'asc' } });
    return NextResponse.json({
      users: users.map(u => {
        const { password: _pw, ...safe } = u;
        return serialize(safe);
      }) as User[],
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { response } = await requireAdmin();
    if (response) return response;

    const body = await req.json().catch(() => ({}));
    const v = validate(userCreateSchema, body);
    if (!v.ok) validationError(v.error, v.details);

    const data = v.data;

    // Check for duplicate email
    const existing = await db.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return NextResponse.json({ error: 'This email is already registered', code: 'EMAIL_TAKEN' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const created = await db.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: data.role,
      },
    });

    const { password: _pw, ...safeUser } = created;
    return NextResponse.json({ user: serialize(safeUser) as User });
  } catch (err) {
    return toErrorResponse(err);
  }
}
