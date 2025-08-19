import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface BookingRequest {
  serviceId: string;
  date: string;
  time: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const body: BookingRequest = await request.json();

    // Validate required fields
    if (!userId || !body.serviceId || !body.date || !body.time || 
        !body.firstName || !body.lastName || !body.email || !body.phone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify user exists and has public booking enabled
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { schedulingPage: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (!user.schedulingPage?.isPublic) {
      return NextResponse.json(
        { error: 'Booking page is not public' },
        { status: 403 }
      );
    }

    // Get service details
    const service = await prisma.service.findFirst({
      where: {
        id: body.serviceId,
        userId: userId,
        isVisible: true
      }
    });

    if (!service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }

    // Calculate appointment times
    const [hours, minutes] = body.time.split(':').map(Number);
    const startTime = new Date(`${body.date}T${body.time}:00`);
    const endTime = new Date(startTime.getTime() + service.duration * 60000);

    // Check availability one more time to prevent double-booking
    const conflictingAppointments = await prisma.appointment.findMany({
      where: {
        userId: userId,
        status: { in: ['CONFIRMED', 'SCHEDULED'] },
        OR: [
          {
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gt: startTime } }
            ]
          },
          {
            AND: [
              { startTime: { lt: endTime } },
              { endTime: { gte: endTime } }
            ]
          },
          {
            AND: [
              { startTime: { gte: startTime } },
              { endTime: { lte: endTime } }
            ]
          }
        ]
      }
    });

    if (conflictingAppointments.length > 0) {
      return NextResponse.json(
        { error: 'This time slot is no longer available' },
        { status: 409 }
      );
    }

    // Find or create client
    let client = await prisma.client.findFirst({
      where: {
        userId: userId,
        email: body.email
      }
    });

    if (!client) {
      client = await prisma.client.create({
        data: {
          userId: userId,
          firstName: body.firstName,
          lastName: body.lastName,
          email: body.email,
          phone: body.phone
        }
      });
    }

    // Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        title: service.name,
        startTime: startTime,
        endTime: endTime,
        status: 'SCHEDULED',
        description: '',
        userId: userId,
        clientId: client.id,
        serviceId: service.id
      },
      include: {
        client: true,
        service: true
      }
    });

    // Return confirmation details
    return NextResponse.json({
      success: true,
      appointment: {
        id: appointment.id,
        title: appointment.title,
        date: body.date,
        time: body.time,
        duration: service.duration,
        price: service.price,
        client: {
          name: `${client.firstName} ${client.lastName}`,
          email: client.email,
          phone: client.phone
        }
      }
    });

  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    );
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}