import { NextRequest, NextResponse } from 'next/server';
import { resolveUserFromSubdomain } from '@/lib/subdomain-utils';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const subdomain = searchParams.get('subdomain');

    if (!subdomain) {
      return NextResponse.json({ error: 'Subdomain parameter is required' }, { status: 400 });
    }

    const user = await resolveUserFromSubdomain(subdomain);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ userId: user.id });
  } catch (error) {
    console.error('Error resolving subdomain:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}