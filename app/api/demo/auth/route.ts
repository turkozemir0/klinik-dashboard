import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (
    email === process.env.DEMO_EMAIL &&
    password === process.env.DEMO_PASSWORD
  ) {
    const res = NextResponse.json({ ok: true });
    res.cookies.set('demo_auth', process.env.DEMO_AUTH_SECRET!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 gün
      path: '/',
    });
    return res;
  }

  return NextResponse.json({ error: 'Geçersiz email veya şifre.' }, { status: 401 });
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete('demo_auth');
  return res;
}
