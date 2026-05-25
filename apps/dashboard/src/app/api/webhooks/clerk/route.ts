import { NextResponse } from 'next/server';

const PROXY_URL = process.env.NEXT_PUBLIC_PROXY_URL || 'http://localhost:8080';

export async function POST(req: Request) {
  const payload = await req.json();
  const eventType = payload.type;

  if (eventType === 'user.created') {
    const { id, email_addresses, first_name, last_name } = payload.data;
    const email = email_addresses?.[0]?.email_address;
    if (!email) return NextResponse.json({ error: 'No email' }, { status: 400 });

    const res = await fetch(`${PROXY_URL}/api/internal/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clerkId: id,
        email,
        name: [first_name, last_name].filter(Boolean).join(' ') || null,
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
