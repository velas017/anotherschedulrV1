import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { fontFamily, primaryColor, secondaryColor, welcomeMessage, allowOnlineBooking } = body;

    // Upsert scheduling page settings
    const schedulingPage = await prisma.schedulingPage.upsert({
      where: {
        userId: session.user.id
      },
      create: {
        userId: session.user.id,
        fontFamily: fontFamily || 'Inter',
        primaryColor: primaryColor || '#000000',
        secondaryColor: secondaryColor || '#6b7280',
        welcomeMessage: welcomeMessage || null,
        allowOnlineBooking: allowOnlineBooking !== undefined ? allowOnlineBooking : true,
        isPublic: true
      },
      update: {
        ...(fontFamily && { fontFamily }),
        ...(primaryColor && { primaryColor }),
        ...(secondaryColor && { secondaryColor }),
        ...(welcomeMessage !== undefined && { welcomeMessage }),
        ...(allowOnlineBooking !== undefined && { allowOnlineBooking })
      }
    });

    return NextResponse.json({
      success: true,
      schedulingPage
    });

  } catch (error) {
    console.error('Error saving scheduling page settings:', error);
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const schedulingPage = await prisma.schedulingPage.findUnique({
      where: {
        userId: session.user.id
      }
    });

    if (!schedulingPage) {
      // Return default settings
      return NextResponse.json({
        fontFamily: 'Inter',
        primaryColor: '#000000',
        secondaryColor: '#6b7280',
        welcomeMessage: null,
        allowOnlineBooking: true
      });
    }

    return NextResponse.json({
      fontFamily: schedulingPage.fontFamily,
      primaryColor: schedulingPage.primaryColor,
      secondaryColor: schedulingPage.secondaryColor,
      welcomeMessage: schedulingPage.welcomeMessage,
      allowOnlineBooking: schedulingPage.allowOnlineBooking
    });

  } catch (error) {
    console.error('Error fetching scheduling page settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}