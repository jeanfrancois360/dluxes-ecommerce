import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

/**
 * GET /api/affiliate/redirect/[id]?locale=en
 *
 * Server-side intermediary for the affiliate click endpoint.
 * The backend POST /affiliate/products/:id/click uses NestJS @Redirect() which
 * returns a 302 with a Location header pointing to the Awin deep link.
 * A browser fetch() cannot cleanly follow that redirect (CORS + CSP block the
 * external Awin domain), so this route handler does the POST server-side,
 * captures the Location header, and issues its own 302 to the browser.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const locale = request.nextUrl.searchParams.get('locale') ?? 'en';
  const referrer = request.headers.get('referer') ?? '';

  // Forward the real client IP so the backend logs the user's IP, not the
  // Next.js server's IP. x-forwarded-for may be a comma-separated list when
  // behind a proxy — the first entry is the originating client.
  const clientIp =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    '';

  // Forward the auth token so logged-in clicks are attributed to the user.
  // The backend reads req.user?.id from the JWT guard; anonymous clicks pass
  // through fine with no Authorization header.
  const authHeader = request.headers.get('authorization') ?? '';

  const forwardHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(clientIp && { 'x-forwarded-for': clientIp }),
    ...(authHeader && { Authorization: authHeader }),
  };

  try {
    const res = await fetch(`${API_URL}/affiliate/products/${id}/click`, {
      method: 'POST',
      headers: forwardHeaders,
      body: JSON.stringify({ locale, referrer }),
      redirect: 'manual', // capture the 302 instead of following it
    });

    const location = res.headers.get('location');
    if (location) {
      return NextResponse.redirect(location);
    }
  } catch {
    // fall through to safe fallback
  }

  // If click logging fails, redirect to the affiliate listing rather than 500-ing
  return NextResponse.redirect(new URL('/affiliate', request.url));
}
