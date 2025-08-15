import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface BusinessHours {
  [key: string]: {
    open: boolean;
    start?: string;
    end?: string;
  };
}

interface TimeSlot {
  time: string;
  available: boolean;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const serviceDuration = searchParams.get('duration');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }

    if (!serviceDuration) {
      return NextResponse.json({ error: 'Service duration is required' }, { status: 400 });
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

    // Parse the requested date
    const requestedDate = new Date(date);
    const fullDayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayIndex = requestedDate.getDay();
    const fullDayName = fullDayNames[dayIndex];

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
    }
    const dayHours = businessHours[fullDayName];

    // Check if the business is open on this day
    if (!dayHours || !dayHours.open) {
      return NextResponse.json({ 
        date,
        timeSlots: [],
        message: 'Business is closed on this day'
      });
    }

    // Parse business hours
    const startTime = dayHours.start || '09:00';
    const endTime = dayHours.end || '17:00';
    const duration = parseInt(serviceDuration);

    // Generate time slots for the day
    const timeSlots: TimeSlot[] = generateTimeSlots(startTime, endTime, duration);

    // Get existing appointments for this date
    const startOfDay = new Date(requestedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(requestedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingAppointments = await prisma.appointment.findMany({
      where: {
        userId: userId,
        startTime: {
          gte: startOfDay,
          lte: endOfDay
        },
        status: {
          in: ['CONFIRMED', 'PENDING']
        }
      },
      select: {
        startTime: true,
        endTime: true
      }
    });

    // Filter out unavailable time slots
    const availableTimeSlots = timeSlots.map(slot => {
      const slotStart = new Date(`${date}T${slot.time}:00`);
      const slotEnd = new Date(slotStart.getTime() + duration * 60000);

      // Check if this slot conflicts with any existing appointment
      const hasConflict = existingAppointments.some(appointment => {
        const appointmentStart = new Date(appointment.startTime);
        const appointmentEnd = new Date(appointment.endTime);

        // Check for overlap
        return (slotStart < appointmentEnd && slotEnd > appointmentStart);
      });

      return {
        ...slot,
        available: !hasConflict
      };
    });

    return NextResponse.json({
      date,
      dayName: fullDayName,
      timeSlots: availableTimeSlots,
      businessHours: {
        start: startTime,
        end: endTime,
        open: dayHours.open
      }
    });

  } catch (error) {
    console.error('Error fetching availability:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function generateTimeSlots(startTime: string, endTime: string, duration: number): TimeSlot[] {
  const slots: TimeSlot[] = [];
  
  // Parse start and end times
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;
  
  // Generate slots every 15 minutes, but only if the service can fit
  for (let minutes = startMinutes; minutes + duration <= endMinutes; minutes += 15) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    // Format time as HH:MM
    const timeString = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    
    slots.push({
      time: timeString,
      available: true // Will be updated based on existing appointments
    });
  }
  
  return slots;
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