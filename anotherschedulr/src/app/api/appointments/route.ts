import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { appointmentSchema, validateRequestBody, validateQueryParams, dateRangeSchema } from '@/lib/validations';

// GET /api/appointments - Fetch appointments for the current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters for date filtering
    const { searchParams } = new URL(request.url);
    const validation = validateQueryParams(searchParams, dateRangeSchema);
    
    const whereClause: Record<string, unknown> = {
      userId: session.user.id,
    };

    // Add date filtering if provided
    if (validation.success) {
      const { startDate, endDate } = validation.data;
      
      if (startDate || endDate) {
        whereClause.AND = [];
        
        if (startDate) {
          whereClause.AND.push({
            endTime: { gte: new Date(startDate) }
          });
        }
        
        if (endDate) {
          whereClause.AND.push({
            startTime: { lte: new Date(endDate) }
          });
        }
      }
    }

    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        service: {
          select: {
            id: true,
            name: true,
            duration: true,
            price: true
          }
        }
      },
      orderBy: { startTime: 'asc' }
    });

    return NextResponse.json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/appointments - Create a new appointment
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate and sanitize input
    const validation = await validateRequestBody(request, appointmentSchema);
    
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { title, description, startTime, endTime, status, clientId, serviceId } = validation.data;

    // Verify that the client belongs to the current user
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        userId: session.user.id
      }
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Verify that the service belongs to the current user (if provided)
    if (serviceId) {
      const service = await prisma.service.findFirst({
        where: {
          id: serviceId,
          userId: session.user.id
        }
      });

      if (!service) {
        return NextResponse.json({ error: 'Service not found' }, { status: 404 });
      }
    }

    // Check for appointment conflicts
    const startDateTime = new Date(startTime);
    const endDateTime = new Date(endTime);

    // Validate that start time is before end time
    if (startDateTime >= endDateTime) {
      return NextResponse.json({ error: 'End time must be after start time' }, { status: 400 });
    }

    const conflictingAppointments = await prisma.appointment.findMany({
      where: {
        userId: session.user.id,
        OR: [
          {
            AND: [
              { startTime: { lte: startDateTime } },
              { endTime: { gt: startDateTime } }
            ]
          },
          {
            AND: [
              { startTime: { lt: endDateTime } },
              { endTime: { gte: endDateTime } }
            ]
          },
          {
            AND: [
              { startTime: { gte: startDateTime } },
              { endTime: { lte: endDateTime } }
            ]
          }
        ]
      }
    });

    if (conflictingAppointments.length > 0) {
      return NextResponse.json({ 
        error: 'This time slot conflicts with an existing appointment',
        conflicts: conflictingAppointments.map(apt => ({
          id: apt.id,
          title: apt.title,
          startTime: apt.startTime,
          endTime: apt.endTime
        }))
      }, { status: 409 });
    }

    const appointment = await prisma.appointment.create({
      data: {
        title,
        description,
        startTime: startDateTime,
        endTime: endDateTime,
        status: status || 'SCHEDULED',
        clientId,
        serviceId,
        userId: session.user.id
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        service: {
          select: {
            id: true,
            name: true,
            duration: true,
            price: true
          }
        }
      }
    });

    return NextResponse.json(appointment, { status: 201 });
  } catch (error) {
    console.error('Error creating appointment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}