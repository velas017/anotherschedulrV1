import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";

const prisma = new PrismaClient();

export async function GET() {
  // Only allow in development environment
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: "Debug endpoints are not available in production" },
      { status: 403 }
    );
  }

  // Check authentication
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized - must be logged in to access debug information" },
      { status: 401 }
    );
  }

  const userId = session.user.id;

  try {
    // Check database contents - ONLY for the current user
    const [users, sessions, accounts, clients, services, appointments] = await Promise.all([
      prisma.user.findMany({
        where: { id: userId }, // Only current user
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          createdAt: true,
          _count: {
            select: {
              sessions: true,
              accounts: true,
              clients: true,
              services: true,
              appointments: true,
            }
          }
        }
      }),
      prisma.session.findMany({
        where: { userId: userId }, // Only current user's sessions
        select: {
          id: true,
          sessionToken: true,
          expires: true,
          userId: true,
          user: {
            select: {
              email: true,
              name: true,
            }
          }
        }
      }),
      prisma.account.findMany({
        where: { userId: userId }, // Only current user's accounts
        select: {
          id: true,
          provider: true,
          providerAccountId: true,
          userId: true,
          user: {
            select: {
              email: true,
              name: true,
            }
          }
        }
      }),
      prisma.client.count({
        where: { userId: userId } // Count of user's clients
      }),
      prisma.service.count({
        where: { userId: userId } // Count of user's services
      }),
      prisma.appointment.count({
        where: { userId: userId } // Count of user's appointments
      })
    ]);

    const stats = {
      currentUser: users[0]?.email || "Unknown",
      totalSessions: sessions.length,
      totalAccounts: accounts.length,
      activeSessions: sessions.filter(s => new Date(s.expires) > new Date()).length,
      expiredSessions: sessions.filter(s => new Date(s.expires) <= new Date()).length,
      totalClients: clients,
      totalServices: services,
      totalAppointments: appointments,
    };

    return NextResponse.json({
      status: "✅ Database accessible - Tenant-isolated view",
      timestamp: new Date().toISOString(),
      authenticatedAs: session.user.email,
      stats,
      data: {
        user: users.map(user => ({
          ...user,
          createdAt: user.createdAt.toISOString(),
        }))[0], // Single user object
        sessions: sessions.map(session => ({
          ...session,
          expires: session.expires.toISOString(),
          sessionToken: session.sessionToken.substring(0, 10) + "...", // Hide full token
        })),
        accounts,
      },
      businessData: {
        clients: clients,
        services: services,
        appointments: appointments,
      },
      recommendations: [
        sessions.length === 0 ? "⚠️ No active sessions - you may need to sign in again" : "✅ Active sessions found",
        accounts.length === 0 ? "⚠️ No linked accounts - consider adding OAuth for easier login" : "✅ OAuth accounts linked",
        clients === 0 ? "💡 No clients yet - start adding your customers" : `✅ ${clients} clients registered`,
        services === 0 ? "💡 No services defined - add services you offer" : `✅ ${services} services available`,
        appointments === 0 ? "💡 No appointments scheduled" : `✅ ${appointments} appointments in system`,
      ]
    });
  } catch (error) {
    console.error("Database check error:", error);
    return NextResponse.json(
      { 
        error: "Failed to check database",
        message: error instanceof Error ? error.message : "Unknown error",
        recommendations: [
          "Check if the database is accessible",
          "Verify Prisma connection string",
          "Run 'npx prisma migrate dev' if needed"
        ]
      },
      { status: 500 }
    );
  }
}