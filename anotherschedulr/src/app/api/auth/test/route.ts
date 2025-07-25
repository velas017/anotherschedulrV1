import { getServerSession } from "next-auth/next";
import { authOptions } from "../[...nextauth]/route";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    return NextResponse.json({
      authenticated: !!session,
      session: session,
      timestamp: new Date().toISOString(),
      message: session ? "✅ Authenticated" : "❌ Not authenticated",
    });
  } catch (error) {
    console.error("Session test error:", error);
    return NextResponse.json({
      authenticated: false,
      error: "Failed to get session",
      message: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}