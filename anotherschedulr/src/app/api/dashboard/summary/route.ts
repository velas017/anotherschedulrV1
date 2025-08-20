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

    // Get date ranges
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    
    // Current month range
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    
    // Current week range (Sunday to Saturday)
    const currentDay = now.getDay();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - currentDay);
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    // Fetch all data in parallel using Prisma transactions for better performance
    const [
      todayAppointments,
      monthAppointmentsCount,
      weekAppointmentsCount,
      totalClients,
      activeServices
    ] = await Promise.all([
      // Today's appointments with details
      prisma.appointment.findMany({
        where: {
          userId: session.user.id,
          startTime: { gte: todayStart },
          endTime: { lte: todayEnd }
        },
        include: {
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
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
      }),
      
      // Monthly appointments count
      prisma.appointment.count({
        where: {
          userId: session.user.id,
          startTime: { lte: monthEnd },
          endTime: { gte: monthStart }
        }
      }),
      
      // Weekly appointments count
      prisma.appointment.count({
        where: {
          userId: session.user.id,
          startTime: { lte: weekEnd },
          endTime: { gte: weekStart }
        }
      }),
      
      // Total clients count
      prisma.client.count({
        where: { userId: session.user.id }
      }),
      
      // Active services count
      prisma.service.count({
        where: {
          userId: session.user.id,
          isVisible: true
        }
      })
    ]);

    // Calculate today's revenue
    const todayRevenue = todayAppointments.reduce((total, apt) => {
      return total + (apt.service?.price || 0);
    }, 0);

    // Return consolidated dashboard data
    return NextResponse.json({
      stats: {
        todayAppointments: todayAppointments.length,
        currentMonthAppointments: monthAppointmentsCount,
        currentWeekAppointments: weekAppointmentsCount,
        totalClients,
        activeServices,
        todayRevenue
      },
      todayAppointmentsList: todayAppointments,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}