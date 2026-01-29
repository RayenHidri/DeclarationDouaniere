// app/api/sa/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export async function GET(
  _req: NextRequest,
  context: { params: { id: string } },
) {
  const id = context.params?.id;

  if (!id || id === 'undefined' || id === 'null') {
    return NextResponse.json(
      { message: 'Invalid SA id in route' },
      { status: 400 },
    );
  }

  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;

  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const backendRes = await fetch(`${API_URL}/sa/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const text = await backendRes.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  return NextResponse.json(data, { status: backendRes.status });
}
