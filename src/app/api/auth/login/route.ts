// Custom login — verifies credentials, creates a JWT via NextAuth's own encoder
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { encode } from 'next-auth/jwt';
import { db } from '../../../../../src/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Use NextAuth's own JWT encoder so the session endpoint can decode it
    const token = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    const jwt = await encode({
      token,
      secret: process.env.NEXTAUTH_SECRET || 'fallback-secret',
      maxAge: 30 * 24 * 60 * 60,
    });

    const response = NextResponse.json({ ok: true, user: { email: user.email, name: user.name } });

    // Set the session cookie — both variants for dev and prod
    response.cookies.set('next-auth.session-token', jwt, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    });

    response.cookies.set('__Secure-next-auth.session-token', jwt, {
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    });

    return response;
  } catch (err) {
    console.error('[login]', err);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
