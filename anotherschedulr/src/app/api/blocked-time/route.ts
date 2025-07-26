import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// GET /api/blocked-time - Get all blocked times for the current user
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters for date filtering
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const whereClause: any = {
      userId: session.user.id,
    };

    // Add date filtering if provided
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

    const blockedTimes = await prisma.blockedTime.findMany({
      where: whereClause,
      orderBy: { startTime: 'asc' },
    });

    return NextResponse.json(blockedTimes);
  } catch (error) {
    console.error('Error fetching blocked times:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blocked times' },
      { status: 500 }
    );
  }
}

// POST /api/blocked-time - Create a new blocked time
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      startTime,
      endTime,
      reason,
      isRecurring,
      recurrenceType,
      recurrenceEnd,
    } = body;

    // Validate required fields
    if (!startTime || !endTime) {
      return NextResponse.json(
        { error: 'Start time and end time are required' },
        { status: 400 }
      );
    }

    // Validate dates
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      return NextResponse.json(
        { error: 'End time must be after start time' },
        { status: 400 }
      );
    }

    // Check for overlapping blocked times
    const overlapping = await prisma.blockedTime.findFirst({
      where: {
        userId: session.user.id,
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

    // Create the blocked time
    console.log('✅ Creating blocked time for user:', session.user.id);
    console.log('✅ Time period:', { start: start.toISOString(), end: end.toISOString() });
    
    const blockedTime = await prisma.blockedTime.create({
      data: {
        userId: session.user.id,
        startTime: start,
        endTime: end,
        reason,
        isRecurring: isRecurring || false,
        recurrenceType: isRecurring ? recurrenceType : null,
        recurrenceEnd: recurrenceEnd ? new Date(recurrenceEnd) : null,
      },
    });

    console.log('✅ Successfully created blocked time:', blockedTime.id);
    return NextResponse.json(blockedTime, { status: 201 });
  } catch (error) {
    console.error('❌ Error creating blocked time:', error);
    console.error('❌ Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to create blocked time',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}