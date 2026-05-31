import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = request.headers.get('authorization') ?? '';
  const body = await request.json();

  const res = await fetch(`${API_URL}/commission/overrides/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: auth },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = request.headers.get('authorization') ?? '';

  const res = await fetch(`${API_URL}/commission/overrides/${id}`, {
    method: 'DELETE',
    headers: { Authorization: auth },
  });

  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return new NextResponse(null, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
