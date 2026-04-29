import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// In-memory sliding window rate limiter (resets on cold start — acceptable for Edge)
// For production with strict requirements, use Vercel KV or Upstash Redis.
const RATE_LIMIT = 100; // requests per window
const RATE_LIMIT_WINDOW = 60_000; // 60 seconds in ms
const rateLimitStore = new Map<string, number[]>();

// Stricter limits for sensitive endpoints (auth, payment)
const STRICT_RATE_LIMIT = 10; // max 10 attempts per window
const STRICT_RATE_LIMIT_WINDOW = 300_000; // 5 minutes
const strictRateLimitStore = new Map<string, number[]>();

const STRICT_PATHS = ["/api/admin/auth", "/api/customer/auth", "/api/staff/auth"];

function getRateLimitKey(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded ? forwarded.split(",")[0].trim() : "unknown";
}

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const timestamps = (rateLimitStore.get(ip) || []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW
  );

  if (timestamps.length >= RATE_LIMIT) {
    rateLimitStore.set(ip, timestamps);
    return { allowed: false, remaining: 0 };
  }

  timestamps.push(now);
  rateLimitStore.set(ip, timestamps);

  // Periodic cleanup: remove old entries every 200 requests or when store exceeds 500
  if (rateLimitStore.size > 500 || timestamps.length % 200 === 0) {
    for (const [key, val] of rateLimitStore) {
      const fresh = val.filter((t) => now - t < RATE_LIMIT_WINDOW);
      if (fresh.length === 0) rateLimitStore.delete(key);
      else rateLimitStore.set(key, fresh);
    }
  }

  return { allowed: true, remaining: RATE_LIMIT - timestamps.length };
}

function checkStrictRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const timestamps = (strictRateLimitStore.get(ip) || []).filter(
    (t) => now - t < STRICT_RATE_LIMIT_WINDOW
  );

  if (timestamps.length >= STRICT_RATE_LIMIT) {
    strictRateLimitStore.set(ip, timestamps);
    return { allowed: false, remaining: 0 };
  }

  timestamps.push(now);
  strictRateLimitStore.set(ip, timestamps);

  if (strictRateLimitStore.size > 500) {
    for (const [key, val] of strictRateLimitStore) {
      const fresh = val.filter((t) => now - t < STRICT_RATE_LIMIT_WINDOW);
      if (fresh.length === 0) strictRateLimitStore.delete(key);
      else strictRateLimitStore.set(key, fresh);
    }
  }

  return { allowed: true, remaining: STRICT_RATE_LIMIT - timestamps.length };
}

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const { pathname } = request.nextUrl;

  // Rate limiting — enforce on API routes
  const clientIp = getRateLimitKey(request);
  if (pathname.startsWith("/api/")) {
    // Stricter rate limit for auth endpoints (10 req / 5 min)
    if (STRICT_PATHS.some((p) => pathname.startsWith(p)) && request.method === "POST") {
      const strict = checkStrictRateLimit(clientIp);
      if (!strict.allowed) {
        return new NextResponse(
          JSON.stringify({ error: "Too many login attempts. Try again in 5 minutes." }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json",
              "Retry-After": "300",
            },
          }
        );
      }
    }

    const { allowed, remaining } = checkRateLimit(clientIp);
    response.headers.set("X-RateLimit-Limit", String(RATE_LIMIT));
    response.headers.set("X-RateLimit-Remaining", String(remaining));

    if (!allowed) {
      return new NextResponse("Too Many Requests", {
        status: 429,
        headers: {
          "Content-Type": "text/plain",
          "Retry-After": "60",
          "X-RateLimit-Limit": String(RATE_LIMIT),
          "X-RateLimit-Remaining": "0",
        },
      });
    }
  }

  // Block suspicious patterns
  const suspiciousPatterns = [
    /\.\./,  // Path traversal
    /<script/i,  // XSS attempts
    /javascript:/i,  // JavaScript protocol
    /\bon\w+=["']/i,  // Event handlers (word boundary + quotes to avoid false positives)
    /eval\(/i,  // Eval injection
    /union\s+select/i,  // SQL injection
    /insert\s+into/i,  // SQL injection
    /delete\s+from/i,  // SQL injection
    /drop\s+table/i,  // SQL injection
    /%3C.*script/i,  // Encoded XSS
    /\$\{.*\}/,  // Template injection
  ];

  let url: string;
  try {
    url = decodeURIComponent(request.url);
  } catch {
    return new NextResponse("Bad Request", {
      status: 400,
      headers: { "Content-Type": "text/plain" },
    });
  }
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
