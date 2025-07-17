import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    console.log("🔍 Middleware triggered for:", req.nextUrl.pathname);
    console.log("🔍 Token exists:", !!req.nextauth.token);
    console.log("🔍 Token data:", req.nextauth.token);
    
    // Let the request continue for now - we'll handle auth in the component
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        console.log("🔍 Authorization callback:", {
          pathname: req.nextUrl.pathname,
          hasToken: !!token,
          tokenEmail: token?.email,
        });
        
        // For now, allow all requests and handle auth in components
        // This helps us debug the session issue
        return true;
        
        // Original logic (commented out for debugging):
        // if (req.nextUrl.pathname.startsWith("/dashboard")) {
        //   return !!token;
        // }
        // return true;
      },
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*"],
};