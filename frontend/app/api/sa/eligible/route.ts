// app/api/sa/eligible/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

// évite le cache foireux en dev
export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;

  if (!token) {
    return NextResponse.json(
      { message: 'Unauthorized: no access_token cookie' },
      { status: 401 },
    );
  }

  try {
    const res = await fetch(`${API_URL}/sa/eligible`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    // on essaie de parser le JSON, mais on gère aussi le cas où ce n'est pas du JSON
    const text = await res.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }

    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('Error in /api/sa/eligible route handler:', error);
    return NextResponse.json(
      { message: 'Erreur interne côté proxy /api/sa/eligible.' },
      { status: 500 },
    );
  }
}
