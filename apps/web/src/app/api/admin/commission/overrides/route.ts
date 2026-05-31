import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization') ?? '';
  const search = request.nextUrl.search;

  const res = await fetch(`${API_URL}/commission/overrides${search}`, {
    headers: { Authorization: auth },
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function POST(request: NextRequest) {
  const auth = request.headers.get('authorization') ?? '';
  const body = await request.json();

  const res = await fetch(`${API_URL}/commission/overrides`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: auth },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
