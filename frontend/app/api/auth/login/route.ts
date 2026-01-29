import { NextRequest, NextResponse } from 'next/server';

const NEST_API_URL = process.env.NEST_API_URL;

export async function POST(req: NextRequest) {
  if (!NEST_API_URL) {
    return NextResponse.json(
      { message: 'NEST_API_URL is not configured' },
      { status: 500 },
    );
  }

  const { email, password } = await req.json();

  try {
    const response = await fetch(`${NEST_API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          message:
            data?.message ??
            'Identifiants invalides ou erreur du serveur d’authentification.',
        },
        { status: response.status },
      );
    }

    const { access_token, user } = data;

    const res = NextResponse.json({ user });

    // Cookie HTTP-only pour le token
    res.cookies.set('access_token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 15, // 15 minutes
    });

    return res;
  } catch (error) {
    console.error('Login proxy error:', error);
    return NextResponse.json(
      { message: 'Erreur réseau vers le serveur Nest.' },
      { status: 500 },
    );
  }
}
