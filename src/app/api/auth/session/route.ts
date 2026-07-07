import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { toErrorResponse } from '@/lib/api-error';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** GET /api/auth/session-check — returns whether the user is authenticated */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user) {
      return NextResponse.json({
        authenticated: true,
        user: {
          email: session.user.email,
          name: session.user.name,
          role: (session.user as any).role,
        },
      });
    }
    return NextResponse.json({ authenticated: false });
  } catch (err) {
    return toErrorResponse(err);
  }
}
