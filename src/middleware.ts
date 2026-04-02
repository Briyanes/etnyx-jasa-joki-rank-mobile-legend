import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT = 100; // requests per window
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in milliseconds

function getRateLimitKey(request: NextRequest): string {
  // Use IP address or forwarded IP
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
  return `rate-limit:${ip}`;
}

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return false;
  }

  record.count++;
  if (record.count > RATE_LIMIT) {
    return true;
  }

  return false;
}

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, RATE_LIMIT_WINDOW);

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const { pathname } = request.nextUrl;

  // Rate limiting
  const rateLimitKey = getRateLimitKey(request);
  if (isRateLimited(rateLimitKey)) {
    return new NextResponse("Too Many Requests", {
      status: 429,
      headers: {
        "Retry-After": "60",
        "Content-Type": "text/plain",
      },
    });
  }

  // Block suspicious patterns
  const suspiciousPatterns = [
    /\.\./,  // Path traversal
    /<script/i,  // XSS attempts
    /javascript:/i,  // JavaScript protocol
    /on\w+=/i,  // Event handlers
    /eval\(/i,  // Eval injection
    /union.*select/i,  // SQL injection
    /insert.*into/i,  // SQL injection
    /delete.*from/i,  // SQL injection
    /drop.*table/i,  // SQL injection
    /%3C.*script/i,  // Encoded XSS
    /\${.*}/,  // Template injection
  ];

  const url = decodeURIComponent(request.url);
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(url)) {
      console.warn(`Blocked suspicious request: ${url}`);
      return new NextResponse("Bad Request", {
        status: 400,
        headers: { "Content-Type": "text/plain" },
      });
    }
  }

  // Block common scanner/bot paths (exclude our /admin routes)
  const blockedPaths = [
    "/wp-admin",
    "/wp-login",
    "/wp-content",
    "/xmlrpc.php",
    "/phpmyadmin",
    "/administrator",
    "/.env",
    "/.git",
    "/config",
    "/backup",
    "/db",
    "/sql",
    "/shell",
    "/cmd",
    "/eval",
  ];

  const lowerPath = pathname.toLowerCase();
  // Skip blocking for our legitimate admin routes
  const isLegitAdmin = lowerPath === "/admin" || lowerPath.startsWith("/admin/");
  if (!isLegitAdmin) {
    for (const blocked of blockedPaths) {
      if (lowerPath.startsWith(blocked)) {
        return new NextResponse("Not Found", {
          status: 404,
          headers: { "Content-Type": "text/plain" },
        });
      }
    }
  }

  // Validate request methods for API routes
  if (pathname.startsWith("/api/")) {
    const allowedMethods = ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"];
    if (!allowedMethods.includes(request.method)) {
      return new NextResponse("Method Not Allowed", {
        status: 405,
        headers: {
          Allow: allowedMethods.join(", "),
          "Content-Type": "text/plain",
        },
      });
    }
  }

  // Add security headers to response
  response.headers.set("X-Request-Id", crypto.randomUUID());
  
  return response;
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
