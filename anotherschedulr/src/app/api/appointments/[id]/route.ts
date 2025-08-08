import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { appointmentSchema, validateRequestBody, idParamSchema } from '@/lib/validations';

// GET /api/appointments/[id] - Get a specific appointment
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate the ID parameter
    const paramValidation = idParamSchema.safeParse({ id: params.id });
    if (!paramValidation.success) {
      return NextResponse.json({ error: 'Invalid appointment ID' }, { status: 400 });
    }

    const appointment = await prisma.appointment.findFirst({
      where: {
        id: params.id,
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

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    return NextResponse.json(appointment);
  } catch (error) {
    console.error('Error fetching appointment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/appointments/[id] - Update a specific appointment
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate the ID parameter
    const paramValidation = idParamSchema.safeParse({ id: params.id });
    if (!paramValidation.success) {
      return NextResponse.json({ error: 'Invalid appointment ID' }, { status: 400 });
    }

    // Verify appointment ownership
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    });

    if (!existingAppointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Validate and sanitize input
    const validation = await validateRequestBody(request, appointmentSchema.partial());
    
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { title, description, startTime, endTime, status, clientId, serviceId } = validation.data;

    // Verify that the client belongs to the current user (if being changed)
    if (clientId && clientId !== existingAppointment.clientId) {
      const client = await prisma.client.findFirst({
        where: {
          id: clientId,
          userId: session.user.id
        }
      });

      if (!client) {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 });
      }
    }

    // Verify that the service belongs to the current user (if being changed)
    if (serviceId && serviceId !== existingAppointment.serviceId) {
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

    // Check for appointment conflicts if time is being changed
    if (startTime && endTime) {
      const startDateTime = new Date(startTime);
      const endDateTime = new Date(endTime);

      // Validate that start time is before end time
      if (startDateTime >= endDateTime) {
        return NextResponse.json({ error: 'End time must be after start time' }, { status: 400 });
      }

      const conflictingAppointments = await prisma.appointment.findMany({
        where: {
          userId: session.user.id,
          id: { not: params.id }, // Exclude current appointment
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
    }

    const updateData: Record<string, unknown> = {};
    
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (startTime !== undefined) updateData.startTime = new Date(startTime);
    if (endTime !== undefined) updateData.endTime = new Date(endTime);
    if (status !== undefined) updateData.status = status;
    if (clientId !== undefined) updateData.clientId = clientId;
    if (serviceId !== undefined) updateData.serviceId = serviceId;

    const appointment = await prisma.appointment.update({
      where: { id: params.id },
      data: updateData,
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

    return NextResponse.json(appointment);
  } catch (error) {
    console.error('Error updating appointment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/appointments/[id] - Delete a specific appointment
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate the ID parameter
    const paramValidation = idParamSchema.safeParse({ id: params.id });
    if (!paramValidation.success) {
      return NextResponse.json({ error: 'Invalid appointment ID' }, { status: 400 });
    }

    // Verify appointment ownership
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    });

    if (!existingAppointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    await prisma.appointment.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}