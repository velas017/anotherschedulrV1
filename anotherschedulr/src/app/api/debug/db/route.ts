import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Check database contents
    const [users, sessions, accounts] = await Promise.all([
      prisma.user.findMany({
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
            }
          }
        }
      }),
      prisma.session.findMany({
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
      })
    ]);

    const stats = {
      totalUsers: users.length,
      totalSessions: sessions.length,
      totalAccounts: accounts.length,
      activeSessions: sessions.filter(s => new Date(s.expires) > new Date()).length,
      expiredSessions: sessions.filter(s => new Date(s.expires) <= new Date()).length,
    };

    return NextResponse.json({
      status: "✅ Database accessible",
      timestamp: new Date().toISOString(),
      stats,
      data: {
        users: users.map(user => ({
          ...user,
          createdAt: user.createdAt.toISOString(),
        })),
        sessions: sessions.map(session => ({
          ...session,
          expires: session.expires.toISOString(),
          sessionToken: session.sessionToken.substring(0, 10) + "...", // Hide full token
        })),
        accounts,
      },
      recommendations: [
        users.length === 0 ? "No users found - OAuth might not be creating users" : "✅ Users exist",
        sessions.length === 0 ? "No sessions found - sessions might not be persisting" : "✅ Sessions exist",
        accounts.length === 0 ? "No accounts found - OAuth accounts might not be linking" : "✅ OAuth accounts exist",
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