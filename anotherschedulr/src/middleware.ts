import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { apiRateLimiter, authRateLimiter, publicRateLimiter, getClientId } from "@/lib/rate-limit";
import { getSubdomainFromHost, isSubdomainRequest } from "@/lib/subdomain-utils";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const host = request.headers.get('host');
  
  // Check if this is a subdomain request
  const subdomain = getSubdomainFromHost(host);
  
  // Handle subdomain routing first
  if (subdomain) {
    // Rewrite subdomain requests to the booking page
    const url = request.nextUrl.clone();
    url.pathname = `/book/${subdomain}`;
    
    // Pass original host in headers for the booking page to use
    const response = NextResponse.rewrite(url);
    response.headers.set('x-subdomain', subdomain);
    response.headers.set('x-original-host', host || '');
    
    // Add security headers for subdomain
    addSecurityHeaders(response);
    
    // Apply rate limiting for subdomain requests
    const clientId = getClientId(request);
    const rateLimitResult = await publicRateLimiter.check(clientId);
    
    if (rateLimitResult && !rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult);
    }
    
    if (rateLimitResult) {
      response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
      response.headers.set('X-RateLimit-Reset', new Date(rateLimitResult.resetTime).toISOString());
    }
    
    return response;
  }
  
  const response = NextResponse.next();

  // Add security headers to all responses
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://api.github.com",
    "frame-ancestors 'none'",
  ].join('; ');
  
  response.headers.set('Content-Security-Policy', csp);

  // Apply rate limiting based on route type
  const clientId = getClientId(request);
  let rateLimitResult;

  // Different rate limits for different endpoint types
  if (pathname.startsWith('/api/auth/register') || pathname.startsWith('/api/auth/signin')) {
    // Strict rate limiting for auth endpoints
    rateLimitResult = await authRateLimiter.check(clientId);
  } else if (pathname.startsWith('/api/public/')) {
    // Moderate rate limiting for public endpoints
    rateLimitResult = await publicRateLimiter.check(clientId);
  } else if (pathname.startsWith('/api/')) {
    // Standard rate limiting for authenticated API endpoints
    rateLimitResult = await apiRateLimiter.check(clientId);
  }

  // Check rate limit
  if (rateLimitResult && !rateLimitResult.success) {
    return new NextResponse(
      JSON.stringify({ 
        error: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': '60',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
          'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
        },
      }
    );
  }

  // Add rate limit headers to successful responses
  if (rateLimitResult) {
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    response.headers.set('X-RateLimit-Reset', new Date(rateLimitResult.resetTime).toISOString());
  }

  // Check authentication for dashboard routes
  if (pathname.startsWith("/dashboard")) {
    // For database sessions, we need to check the session cookie
    const sessionToken = request.cookies.get("next-auth.session-token");
    
    if (!sessionToken) {
      // No session cookie, redirect to signin
      const signInUrl = new URL("/signin", request.url);
      signInUrl.searchParams.set("callbackUrl", request.url);
      return NextResponse.redirect(signInUrl);
    }
  }

  return response;
}

// Helper function to add security headers
function addSecurityHeaders(response: NextResponse) {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN'); // Allow iframe embedding for subdomains
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // CSP for subdomain booking pages
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://api.github.com",
    "frame-ancestors 'self' *", // Allow embedding in iframes
  ].join('; ');
  
  response.headers.set('Content-Security-Policy', csp);
}

// Helper function to create rate limit response
function createRateLimitResponse(rateLimitResult: any) {
  return new NextResponse(
    JSON.stringify({ 
      error: 'Too many requests. Please try again later.',
      retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': '60',
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
        'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
      },
    }
  );
}

export const config = {
  matcher: [
    // Match all routes except static files and images
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};