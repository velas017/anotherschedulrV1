import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let schedulingPage = await prisma.schedulingPage.findUnique({
      where: {
        userId: session.user.id
      }
    });

    // Create default scheduling page if it doesn't exist
    if (!schedulingPage) {
      // Default business hours (Mon-Fri 9AM-5PM)
      const defaultBusinessHours = JSON.stringify({
        sunday: { open: false },
        monday: { open: true, start: '09:00', end: '17:00' },
        tuesday: { open: true, start: '09:00', end: '17:00' },
        wednesday: { open: true, start: '09:00', end: '17:00' },
        thursday: { open: true, start: '09:00', end: '17:00' },
        friday: { open: true, start: '09:00', end: '17:00' },
        saturday: { open: false }
      });

      schedulingPage = await prisma.schedulingPage.create({
        data: {
          userId: session.user.id,
          isPublic: true,
          primaryColor: '#000000',
          secondaryColor: '#6b7280',
          fontFamily: 'Inter',
          allowOnlineBooking: true,
          requireApproval: false,
          businessHours: defaultBusinessHours,
          timezone: 'America/New_York'
        }
      });
    }

    return NextResponse.json(schedulingPage);
  } catch (error) {
    console.error('Error fetching scheduling page:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      isPublic,
      customDomain,
      welcomeMessage,
      primaryColor,
      secondaryColor,
      fontFamily,
      customCSS,
      businessHours,
      timezone,
      allowOnlineBooking,
      requireApproval
    } = body;

    // Upsert scheduling page
    const schedulingPage = await prisma.schedulingPage.upsert({
      where: {
        userId: session.user.id
      },
      update: {
        isPublic,
        customDomain,
        welcomeMessage,
        primaryColor,
        secondaryColor,
        fontFamily,
        customCSS,
        businessHours,
        timezone,
        allowOnlineBooking,
        requireApproval
      },
      create: {
        userId: session.user.id,
        isPublic: isPublic !== undefined ? isPublic : true,
        customDomain,
        welcomeMessage,
        primaryColor: primaryColor || '#000000',
        secondaryColor: secondaryColor || '#6b7280',
        fontFamily: fontFamily || 'Inter',
        customCSS,
        businessHours: businessHours || JSON.stringify({
          sunday: { open: false },
          monday: { open: true, start: '09:00', end: '17:00' },
          tuesday: { open: true, start: '09:00', end: '17:00' },
          wednesday: { open: true, start: '09:00', end: '17:00' },
          thursday: { open: true, start: '09:00', end: '17:00' },
          friday: { open: true, start: '09:00', end: '17:00' },
          saturday: { open: false }
        }),
        timezone: timezone || 'America/New_York',
        allowOnlineBooking: allowOnlineBooking !== undefined ? allowOnlineBooking : true,
        requireApproval: requireApproval !== undefined ? requireApproval : false
      }
    });

    return NextResponse.json(schedulingPage);
  } catch (error) {
    console.error('Error updating scheduling page:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}