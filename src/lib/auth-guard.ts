// Shared auth guard for admin-only API routes.
// Centralized here so route handlers can import it via '@/lib/auth-guard'
// instead of using fragile relative imports like '../route'.
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import type { User as PrismaUser } from '@prisma/client';

/**
 * Require an authenticated admin user.
 * Returns `{ user, response: null }` if the caller is an admin,
 * or `{ user: null, response }` with a 401/403 JSON response otherwise.
 *
 * Usage:
 *   const { user, response } = await requireAdmin();
 *   if (response) return response;
 *   // user is guaranteed to be an admin Prisma User record here
 */
export async function requireAdmin(): Promise<{
  user: PrismaUser | null;
  response: NextResponse | null;
}> {
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
