import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  rateLimit,
  strictRateLimit,
  RATE_LIMIT,
} from "@/lib/rate-limiter";

const STRICT_PATHS = ["/api/admin/auth", "/api/customer/auth", "/api/staff/auth"];

function getRateLimitKey(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded ? forwarded.split(",")[0].trim() : "unknown";
}

// ===== Banned IP Cache (refreshes every 5 minutes) =====
let bannedIpCache: Set<string> | null = null;
let bannedIpCacheTime = 0;
const BANNED_IP_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getBannedIps(): Promise<Set<string>> {
  const now = Date.now();
  if (bannedIpCache && now - bannedIpCacheTime < BANNED_IP_CACHE_TTL) {
    return bannedIpCache;
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseKey) return new Set();

    const res = await fetch(`${supabaseUrl}/rest/v1/banned_ips?select=ip_address`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
      // Short timeout to avoid blocking requests
      signal: AbortSignal.timeout(2000),
    });

    if (!res.ok) return bannedIpCache || new Set();

    const data = (await res.json()) as Array<{ ip_address: string }>;
    bannedIpCache = new Set(data.map((r) => r.ip_address));
    bannedIpCacheTime = now;
    return bannedIpCache;
  } catch {
    // If fetch fails, use stale cache or empty set
    return bannedIpCache || new Set();
  }
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const { pathname } = request.nextUrl;

  // ===== Banned IP Check =====
  const clientIp = getRateLimitKey(request);

  // Check banned IPs for all routes (not just API)
  const bannedIps = await getBannedIps();
  if (bannedIps.size > 0 && bannedIps.has(clientIp)) {
    // For API routes, return JSON error
    if (pathname.startsWith("/api/")) {
      return new NextResponse(
        JSON.stringify({ error: "Akses ditolak." }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }
    // For page routes, redirect to a blocked page
    return new NextResponse("Forbidden", {
      status: 403,
      headers: { "Content-Type": "text/plain" },
    });
  }

  // Rate limiting — enforce on API routes
  if (pathname.startsWith("/api/")) {
    // Stricter rate limit for auth endpoints (10 req / 5 min)
    if (STRICT_PATHS.some((p) => pathname.startsWith(p)) && request.method === "POST") {
      const strict = await strictRateLimit(clientIp);
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

    const { allowed, remaining } = await rateLimit(clientIp);
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

  // Block suspicious patterns — ONLY check pathname (not query string)
  // to avoid false positives on legitimate traffic with query params.
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
  ];

  // Only decode and check the pathname (path segments), NOT the full URL with query string.
  // Query string values may legitimately contain "union", "select", "${...}", etc.
  let decodedPath: string;
  try {
    decodedPath = decodeURIComponent(pathname);
  } catch {
    return new NextResponse("Bad Request", {
      status: 400,
      headers: { "Content-Type": "text/plain" },
    });
  }
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(decodedPath)) {
      console.warn(`[SECURITY] Blocked suspicious pathname: ${decodedPath}`);
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
  // Content-Security-Policy: restrict resource loading to trusted sources
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://connect.facebook.net",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https: https://*.supabase.co",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self' https://*.supabase.co https://sandbox.duitku.com https://passport.duitku.com https://www.google-analytics.com https://connect.facebook.net https://graph.facebook.com",
      "frame-src 'self' https://sandbox.duitku.com https://passport.duitku.com https://www.duitku.com https://www.google.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self' https://sandbox.duitku.com https://passport.duitku.com https://www.duitku.com",
      "upgrade-insecure-requests",
    ].join("; ")
  );
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // QW4: Prevent search engines from indexing admin and API routes
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/")) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), interest-cohort=()");
  
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