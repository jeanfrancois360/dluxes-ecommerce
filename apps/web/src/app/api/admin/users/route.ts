import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

/**
 * Proxy to GET /admin/users
 * Supports ?email=... (mapped to ?search=...) and all standard admin user filters
 */
export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization') ?? '';
  const searchParams = request.nextUrl.searchParams;

  // The page uses ?email=... but the backend accepts ?search=...
  const email = searchParams.get('email');
  const upstream = new URLSearchParams(searchParams);
  if (email) {
    upstream.delete('email');
    upstream.set('search', email);
  }

  const res = await fetch(`${API_URL}/admin/users?${upstream.toString()}`, {
    headers: { Authorization: auth },
  });

  const json = await res.json();

  // Backend returns { success: true, data: { users: [...], total, ... } }
  // The page expects an array of users from this route
  if (json.success && json.data?.users) {
    return NextResponse.json(json.data.users, { status: res.status });
  }

  return NextResponse.json(json, { status: res.status });
}
