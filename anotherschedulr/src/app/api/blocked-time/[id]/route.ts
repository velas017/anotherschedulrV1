import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// PUT /api/blocked-time/[id] - Update a blocked time
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    const {
      startTime,
      endTime,
      reason,
      isRecurring,
      recurrenceType,
      recurrenceEnd,
    } = body;

    // Check if the blocked time exists and belongs to the user
    const existingBlockedTime = await prisma.blockedTime.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingBlockedTime) {
      return NextResponse.json(
        { error: 'Blocked time not found' },
        { status: 404 }
      );
    }

    // Validate dates if provided
    if (startTime && endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);

      if (start >= end) {
        return NextResponse.json(
          { error: 'End time must be after start time' },
          { status: 400 }
        );
      }

      // Check for overlapping blocked times (excluding current one)
      const overlapping = await prisma.blockedTime.findFirst({
        where: {
          userId: session.user.id,
          id: { not: id },
          OR: [
            {
              AND: [
                { startTime: { lte: start } },
                { endTime: { gt: start } }
              ]
            },
            {
              AND: [
                { startTime: { lt: end } },
                { endTime: { gte: end } }
              ]
            },
            {
              AND: [
                { startTime: { gte: start } },
                { endTime: { lte: end } }
              ]
            }
          ]
        }
      });

      if (overlapping) {
        return NextResponse.json(
          { error: 'This time period overlaps with an existing blocked time' },
          { status: 400 }
        );
      }
    }

    // Update the blocked time
    const updatedBlockedTime = await prisma.blockedTime.update({
      where: { id },
      data: {
        ...(startTime && { startTime: new Date(startTime) }),
        ...(endTime && { endTime: new Date(endTime) }),
        ...(reason !== undefined && { reason }),
        ...(isRecurring !== undefined && { isRecurring }),
        ...(recurrenceType !== undefined && { recurrenceType: isRecurring ? recurrenceType : null }),
        ...(recurrenceEnd !== undefined && { recurrenceEnd: recurrenceEnd ? new Date(recurrenceEnd) : null }),
      },
    });

    return NextResponse.json(updatedBlockedTime);
  } catch (error) {
    console.error('Error updating blocked time:', error);
    return NextResponse.json(
      { error: 'Failed to update blocked time' },
      { status: 500 }
    );
  }
}

// DELETE /api/blocked-time/[id] - Delete a blocked time
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Check if the blocked time exists and belongs to the user
    const existingBlockedTime = await prisma.blockedTime.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingBlockedTime) {
      return NextResponse.json(
        { error: 'Blocked time not found' },
        { status: 404 }
      );
    }

    // Delete the blocked time
    await prisma.blockedTime.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Blocked time deleted successfully' });
  } catch (error) {
    console.error('Error deleting blocked time:', error);
    return NextResponse.json(
      { error: 'Failed to delete blocked time' },
      { status: 500 }
    );
  }
}