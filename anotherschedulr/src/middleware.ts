import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Check if it's a dashboard route
  if (pathname.startsWith("/dashboard")) {
    // For database sessions, we need to check the session cookie
    const sessionToken = request.cookies.get("next-auth.session-token");
    
    if (!sessionToken) {
      // No session cookie, redirect to signin
      const signInUrl = new URL("/signin", request.url);
      signInUrl.searchParams.set("callbackUrl", request.url);
      return NextResponse.redirect(signInUrl);
    }
    
    // Session cookie exists, allow the request
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};