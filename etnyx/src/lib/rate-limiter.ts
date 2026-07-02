/**
 * Rate Limiting Abstraction Layer
 *
 * - If UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set, uses Upstash Redis
 *   for distributed rate limiting across Vercel serverless instances.
 * - Otherwise, falls back to in-memory Map (resets on cold start — fine for low traffic).
 *
 * Usage:
 *   import { rateLimit, strictRateLimit } from "@/lib/rate-limiter";
 *
 *   const result = await rateLimit(ip);
 *   if (!result.allowed) return new Response("Too Many Requests", { status: 429 });
 *
 * To enable Redis: set these env vars in Vercel:
 *   UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
 *   UPSTASH_REDIS_REST_TOKEN=xxx
 *
 * Free tier: 10,000 requests/day — plenty for rate limit checks.
 */

// ===== Configuration =====
const RATE_LIMIT = 100; // requests per window
const RATE_LIMIT_WINDOW = 60; // seconds (was 60_000ms)

const STRICT_RATE_LIMIT = 10; // max attempts per window
const STRICT_RATE_LIMIT_WINDOW = 300; // seconds (5 minutes, was 300_000ms)

// ===== Types =====
interface RateLimitResult {
  allowed: boolean;
  remaining: number;
}

interface RateLimiter {
  check(key: string, limit: number, windowSec: number): Promise<RateLimitResult>;
}

// ===== Redis-backed limiter (Upstash) =====
class RedisRateLimiter implements RateLimiter {
  private url: string;
  private token: string;

  constructor(url: string, token: string) {
    this.url = url;
    this.token = token;
  }

  async check(key: string, limit: number, windowSec: number): Promise<RateLimitResult> {
    const redisKey = `ratelimit:${key}`;

    try {
      // Atomic INCR + EXPIRE via Upstash REST pipeline
      const res = await fetch(`${this.url}/pipeline`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([
          ["INCR", redisKey],
          ["EXPIRE", redisKey, windowSec, "NX", "GT"],
        ]),
      });

      if (!res.ok) {
        // If Redis fails, allow the request (fail-open for availability)
        console.warn("[rate-limit] Redis error, failing open:", res.status);
        return { allowed: true, remaining: limit };
      }

      const data = (await res.json()) as Array<{ result?: number }>;
      const count = data?.[0]?.result ?? 0;

      return {
        allowed: count <= limit,
        remaining: Math.max(0, limit - count),
      };
    } catch (err) {
      // Network error — fail open
      console.warn("[rate-limit] Redis fetch failed, failing open:", err);
      return { allowed: true, remaining: limit };
    }
  }
}

// ===== In-memory limiter (fallback) =====
class MemoryRateLimiter implements RateLimiter {
  private stores = new Map<string, Map<string, number[]>>();

  private getStore(prefix: string): Map<string, number[]> {
    if (!this.stores.has(prefix)) {
      this.stores.set(prefix, new Map());
    }
    return this.stores.get(prefix)!;
  }

  async check(key: string, limit: number, windowSec: number): Promise<RateLimitResult> {
    const now = Date.now();
    const windowMs = windowSec * 1000;
    // Use limit as part of the store key to separate global vs strict stores
    const storeKey = `${limit}:${windowSec}`;
    const store = this.getStore(storeKey);
    const timestamps = (store.get(key) || []).filter((t) => now - t < windowMs);

    if (timestamps.length >= limit) {
      store.set(key, timestamps);
      return { allowed: false, remaining: 0 };
    }

    timestamps.push(now);
    store.set(key, timestamps);

    // Periodic cleanup
    if (store.size > 500) {
      for (const [k, v] of store) {
        const fresh = v.filter((t) => now - t < windowMs);
        if (fresh.length === 0) store.delete(k);
        else store.set(k, fresh);
      }
    }

    return { allowed: true, remaining: limit - timestamps.length };
  }
}

// ===== Singleton limiter selection =====
function getLimiter(): RateLimiter {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (redisUrl && redisToken) {
    return new RedisRateLimiter(redisUrl, redisToken);
  }

  // Fallback: in-memory (Edge runtime — resets on cold start)
  return memoryLimiter;
}

// Single in-memory instance (persists across requests within same edge instance)
const memoryLimiter = new MemoryRateLimiter();

// ===== Public API =====
// Note: these are async now to support Redis. The middleware must await them.

export async function rateLimit(key: string): Promise<RateLimitResult> {
  const limiter = getLimiter();
  return limiter.check(`global:${key}`, RATE_LIMIT, RATE_LIMIT_WINDOW);
}

export async function strictRateLimit(key: string): Promise<RateLimitResult> {
  const limiter = getLimiter();
  return limiter.check(`strict:${key}`, STRICT_RATE_LIMIT, STRICT_RATE_LIMIT_WINDOW);
}

export { RATE_LIMIT, STRICT_RATE_LIMIT };