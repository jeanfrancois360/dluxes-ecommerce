import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  try {
    const res = await fetch(
      `https://hts.usitc.gov/reststop/search?keyword=${encodeURIComponent(q)}`,
      { next: { revalidate: 3600 } }
    );

    if (!res.ok) {
      return NextResponse.json([]);
    }

    const raw: Array<{ htsno: string; description: string }> = await res.json();

    // Return top 10 results with 6-digit international HS code (XXXX.XX)
    const results = raw
      .filter((item) => item.htsno && item.description)
      .slice(0, 10)
      .map((item) => ({
        code: item.htsno.slice(0, 7), // e.g. "6109.10" from "6109.10.00.00"
        description: item.description,
      }));

    return NextResponse.json(results);
  } catch {
    return NextResponse.json([]);
  }
}
