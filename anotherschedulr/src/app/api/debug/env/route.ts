import { NextResponse } from "next/server";

export async function GET() {
  // Only allow in development environment
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: "Debug endpoints are not available in production" },
      { status: 403 }
    );
  }

  try {
    // Check all environment variables that NextAuth needs
    const envCheck = {
      DATABASE_URL: {
        exists: !!process.env.DATABASE_URL,
        value: process.env.DATABASE_URL ? "✅ Set" : "❌ Not set",
        preview: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 20) + "..." : "Not set"
      },
      NEXTAUTH_URL: {
        exists: !!process.env.NEXTAUTH_URL,
        value: process.env.NEXTAUTH_URL || "❌ Not set"
      },
      NEXTAUTH_SECRET: {
        exists: !!process.env.NEXTAUTH_SECRET,
        value: process.env.NEXTAUTH_SECRET ? "✅ Set (hidden for security)" : "❌ Not set",
        length: process.env.NEXTAUTH_SECRET?.length || 0
      },
      GOOGLE_CLIENT_ID: {
        exists: !!process.env.GOOGLE_CLIENT_ID,
        value: process.env.GOOGLE_CLIENT_ID ? "✅ Set" : "❌ Not set",
        preview: process.env.GOOGLE_CLIENT_ID ? process.env.GOOGLE_CLIENT_ID.substring(0, 15) + "..." : "Not set"
      },
      GOOGLE_CLIENT_SECRET: {
        exists: !!process.env.GOOGLE_CLIENT_SECRET,
        value: process.env.GOOGLE_CLIENT_SECRET ? "✅ Set (hidden for security)" : "❌ Not set",
        length: process.env.GOOGLE_CLIENT_SECRET?.length || 0
      }
    };

    // Check if all required variables are set
    const allSet = envCheck.NEXTAUTH_URL.exists && 
                   envCheck.NEXTAUTH_SECRET.exists && 
                   envCheck.GOOGLE_CLIENT_ID.exists && 
                   envCheck.GOOGLE_CLIENT_SECRET.exists;

    return NextResponse.json({
      status: allSet ? "✅ All environment variables are set" : "❌ Some environment variables are missing",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      variables: envCheck,
      recommendations: !allSet ? [
        "Ensure .env.local is in the project root directory",
        "Restart your development server after changing environment variables",
        "Check for typos in variable names",
        "Ensure there are no extra spaces in the .env.local file"
      ] : ["Environment looks good! ✅"]
    });
  } catch (error) {
    console.error("Environment check error:", error);
    return NextResponse.json(
      { 
        error: "Failed to check environment variables",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}