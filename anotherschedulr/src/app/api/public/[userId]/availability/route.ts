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

    // Parse the requested date in local timezone to avoid timezone shift issues
    // CRITICAL FIX: new Date('2025-08-19') creates UTC midnight, which shifts to previous day in local timezone
    // Solution: Parse as local date by adding time or using date components
    const [inputYear, inputMonth, inputDay] = date.split('-').map(Number);
    const requestedDate = new Date(inputYear, inputMonth - 1, inputDay); // month is 0-based
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
    // CRITICAL FIX: Create proper UTC date range for the entire day
    // Previous bug: Using setHours on Date objects created in local timezone
    // Fix: Create UTC dates that cover the full 24-hour period
    const utcYear = requestedDate.getUTCFullYear();
    const utcMonth = requestedDate.getUTCMonth();
    const utcDay = requestedDate.getUTCDate();
    
    const startOfDay = new Date(Date.UTC(utcYear, utcMonth, utcDay, 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(utcYear, utcMonth, utcDay, 23, 59, 59, 999));


    const existingAppointments = await prisma.appointment.findMany({
      where: {
        userId: userId,
        startTime: {
          gte: startOfDay,
          lte: endOfDay
        },
        status: {
          in: ['CONFIRMED', 'SCHEDULED']
        }
      },
      select: {
        startTime: true,
        endTime: true,
        id: true,
        status: true,
        title: true
      }
    });


    // Enhanced conflict detection algorithm
    // This algorithm ensures NO time slots are shown that would conflict with existing appointments
    // considering the full service duration of the appointment being booked
    const availableTimeSlots = timeSlots.map(slot => {
      // FINAL FIX: JavaScript automatically handles timezone conversion correctly
      // new Date('2025-08-15T10:00:00') creates a date in the user's local timezone
      // This naturally aligns with how appointments are stored (local time -> UTC in database)
      const slotStart = new Date(`${date}T${slot.time}:00`);
      const slotEnd = new Date(slotStart.getTime() + duration * 60000);


      // Check if this slot conflicts with any existing appointment
      const hasConflict = existingAppointments.some(appointment => {
        const appointmentStart = new Date(appointment.startTime);
        const appointmentEnd = new Date(appointment.endTime);

        // Enhanced overlap detection:
        // Two time ranges overlap if: start1 < end2 AND start2 < end1
        // This catches all possible overlap scenarios:
        // 1. New appointment starts before existing ends AND existing starts before new ends
        // 2. Handles partial overlaps, complete overlaps, and adjacent appointments
        const overlaps = slotStart < appointmentEnd && appointmentStart < slotEnd;
        
        // Additional safety check: ensure minimum buffer between appointments
        // This prevents appointments from being scheduled back-to-back without any transition time
        const bufferMinutes = 0; // Can be increased if business requires buffer time
        if (bufferMinutes > 0) {
          const slotStartWithBuffer = new Date(slotStart.getTime() - bufferMinutes * 60000);
          const slotEndWithBuffer = new Date(slotEnd.getTime() + bufferMinutes * 60000);
          return slotStartWithBuffer < appointmentEnd && appointmentStart < slotEndWithBuffer;
        }
        
        return overlaps;
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