import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

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

    // Fetch visible categories with their visible services
    const categories = await prisma.serviceCategory.findMany({
      where: {
        userId: userId,
        isVisible: true
      },
      include: {
        services: {
          where: {
            isVisible: true
          },
          orderBy: [
            { sortOrder: 'asc' },
            { createdAt: 'desc' }
          ]
        }
      },
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    // Filter out categories with no visible services
    const categoriesWithServices = categories.filter(
      category => category.services.length > 0
    );

    // Get uncategorized services
    const uncategorizedServices = await prisma.service.findMany({
      where: {
        userId: userId,
        isVisible: true,
        categoryId: null
      },
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    // If there are uncategorized services, create a default category
    if (uncategorizedServices.length > 0) {
      categoriesWithServices.push({
        id: 'uncategorized',
        name: 'Services',
        description: null,
        sortOrder: 999,
        isVisible: true,
        userId: userId,
        services: uncategorizedServices,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Get scheduling page configuration
    const config = user.schedulingPage || {
      primaryColor: '#000000',
      secondaryColor: '#6b7280',
      fontFamily: 'Inter',
      allowOnlineBooking: true,
      welcomeMessage: null
    };

    // Check CORS for GET requests
    const origin = request.headers.get('origin');
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
      process.env.NEXTAUTH_URL || 'http://localhost:3000',
    ];
    
    const isAllowed = origin && (
      allowedOrigins.includes(origin) || 
      (process.env.NODE_ENV === 'production' && origin.endsWith('.yourdomain.com'))
    );
    
    const response = NextResponse.json({
      categories: categoriesWithServices,
      config: {
        welcomeMessage: config.welcomeMessage,
        primaryColor: config.primaryColor,
        secondaryColor: config.secondaryColor,
        fontFamily: config.fontFamily,
        allowOnlineBooking: config.allowOnlineBooking
      }
    });
    
    // Add CORS headers if origin is allowed
    if (isAllowed) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    }
    
    return response;

  } catch (error) {
    console.error('Error fetching public services:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// OPTIONS method for CORS support (needed for iframe embedding)
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  
  // Define allowed origins - in production, these should come from environment variables
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
    process.env.NEXTAUTH_URL || 'http://localhost:3000',
    // Add more allowed origins as needed
  ];
  
  // Check if the origin is allowed
  const isAllowed = origin && (
    allowedOrigins.includes(origin) || 
    // Allow subdomains of your main domain in production
    (process.env.NODE_ENV === 'production' && origin.endsWith('.yourdomain.com'))
  );
  
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': isAllowed ? origin : '',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400', // Cache preflight for 24 hours
    },
  });
}