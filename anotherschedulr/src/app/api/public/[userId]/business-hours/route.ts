import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface BusinessHours {
  [key: string]: {
    open: boolean;
    start?: string;
    end?: string;
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Verify user exists and has public booking enabled
    const user = await prisma.user.findUnique({
      where: {
        id: userId
      },
      include: {
        schedulingPage: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if public booking is enabled
    if (!user.schedulingPage?.isPublic) {
      return NextResponse.json({ error: 'Booking page is not public' }, { status: 403 });
    }

    // Get business hours from scheduling page
    let businessHours: BusinessHours = {};
    if (user.schedulingPage?.businessHours) {
      try {
        // Parse if it's a JSON string, otherwise use as-is
        businessHours = typeof user.schedulingPage.businessHours === 'string' 
          ? JSON.parse(user.schedulingPage.businessHours)
          : user.schedulingPage.businessHours as BusinessHours;
      } catch (error) {
        console.error('Error parsing business hours:', error);
        // Fall back to default business hours
        businessHours = {
          sunday: { open: false },
          monday: { open: true, start: '09:00', end: '17:00' },
          tuesday: { open: true, start: '09:00', end: '17:00' },
          wednesday: { open: true, start: '09:00', end: '17:00' },
          thursday: { open: true, start: '09:00', end: '17:00' },
          friday: { open: true, start: '09:00', end: '17:00' },
          saturday: { open: false }
        };
      }
    } else {
      // Default business hours if none set
      businessHours = {
        sunday: { open: false },
        monday: { open: true, start: '09:00', end: '17:00' },
        tuesday: { open: true, start: '09:00', end: '17:00' },
        wednesday: { open: true, start: '09:00', end: '17:00' },
        thursday: { open: true, start: '09:00', end: '17:00' },
        friday: { open: true, start: '09:00', end: '17:00' },
        saturday: { open: false }
      };
    }

    return NextResponse.json({
      businessHours,
      timezone: user.schedulingPage?.timezone || 'America/New_York'
    });

  } catch (error) {
    console.error('Error fetching business hours:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// OPTIONS method for CORS support
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
    process.env.NEXTAUTH_URL || 'http://localhost:3000',
  ];
  
  const isAllowed = origin && (
    allowedOrigins.includes(origin) || 
    (process.env.NODE_ENV === 'production' && origin.endsWith('.yourdomain.com'))
  );
  
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': isAllowed ? origin : '',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}