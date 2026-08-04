import { NextResponse } from 'next/server';

export async function GET() {
  const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!key) {
    return NextResponse.json({ error: { code: 'not_configured', message: 'Push not configured.' } }, { status: 503 });
  }
  return NextResponse.json({ key });
}
