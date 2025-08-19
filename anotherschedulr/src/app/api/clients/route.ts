import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { validateQueryParams, dateRangeSchema } from '@/lib/validations';

// GET /api/clients - Fetch clients for the current user
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

    // Add date filtering if provided (filter by createdAt for "clients added this month")
    if (validation.success) {
      const { startDate, endDate } = validation.data;
      
      if (startDate || endDate) {
        whereClause.AND = [];
        
        if (startDate) {
          whereClause.AND.push({
            createdAt: { gte: new Date(startDate) }
          });
        }
        
        if (endDate) {
          whereClause.AND.push({
            createdAt: { lte: new Date(endDate) }
          });
        }
      }
    }

    const clients = await prisma.client.findMany({
      where: whereClause,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}