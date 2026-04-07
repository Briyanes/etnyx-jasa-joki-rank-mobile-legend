import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

// Rate limit
const checkLimiter = new Map<string, number[]>();

function rateLimit(ip: string): boolean {
  const now = Date.now();
  const window = 60_000; // 1 minute
  const max = 15;
  const timestamps = (checkLimiter.get(ip) || []).filter(t => now - t < window);
  if (timestamps.length >= max) return false;
  timestamps.push(now);
  checkLimiter.set(ip, timestamps);
  // Cleanup
  if (checkLimiter.size > 500) {
    for (const [key, val] of checkLimiter) {
      if (val.filter(t => now - t < window).length === 0) checkLimiter.delete(key);
    }
  }
  return true;
}

// Mobile Legends account lookup using free API
async function lookupMLAccount(userId: string, zoneId: string): Promise<{ success: boolean; nickname?: string; error?: string }> {
  // Try multiple API endpoints as fallback
  const apis = [
    {
      url: `https://api.isan.eu.org/nickname/ml?id=${userId}&zone=${zoneId}`,
      parse: (data: Record<string, unknown>) => {
        if (data.success && data.name) return data.name as string;
        if (data.result && typeof data.result === "string") return data.result;
        return null;
      },
    },
    {
      url: `https://api.whynotbeta.dev/api/free/game/mlbb?userid=${userId}&zoneid=${zoneId}`,
      parse: (data: Record<string, unknown>) => {
        if (data.status && data.result && (data.result as Record<string, unknown>).nameUser) {
          return (data.result as Record<string, unknown>).nameUser as string;
        }
        return null;
      },
    },
  ];

  for (const api of apis) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(api.url, {
        signal: controller.signal,
        headers: { "Accept": "application/json" },
      });
      clearTimeout(timeout);

      if (!res.ok) continue;
      const data = await res.json();
      const nickname = api.parse(data);
      if (nickname) {
        return { success: true, nickname };
      }
    } catch {
      continue; // Try next API
    }
  }

  return { success: false, error: "Tidak dapat memverifikasi akun. Coba lagi nanti." };
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!rateLimit(ip)) {
    return NextResponse.json({ error: "Terlalu banyak request. Coba lagi nanti." }, { status: 429 });
  }

  try {
    const { userId, zoneId } = await request.json();

    if (!userId || !zoneId) {
      return NextResponse.json({ error: "User ID dan Server ID wajib diisi" }, { status: 400 });
    }

    // Validate: userId must be numeric, zoneId must be numeric
    const cleanUserId = String(userId).replace(/\D/g, "");
    const cleanZoneId = String(zoneId).replace(/\D/g, "");

    if (!cleanUserId || cleanUserId.length < 3 || cleanUserId.length > 15) {
      return NextResponse.json({ error: "User ID tidak valid" }, { status: 400 });
    }
    if (!cleanZoneId || cleanZoneId.length < 3 || cleanZoneId.length > 6) {
      return NextResponse.json({ error: "Server ID tidak valid" }, { status: 400 });
    }

    // Check if admin has configured a custom API URL in settings
    let customApiUrl: string | null = null;
    try {
      const supabase = await createAdminClient();
      const { data } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "integrations")
        .single();
      customApiUrl = data?.value?.mlAccountApiUrl || null;
    } catch { /* use default APIs */ }

    // If custom API configured, try that first
    if (customApiUrl) {
      try {
        const url = customApiUrl
          .replace("{userId}", cleanUserId)
          .replace("{zoneId}", cleanZoneId);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);
        if (res.ok) {
          const data = await res.json();
          // Try common response formats
          const nickname = data.name || data.nickname || data.nameUser ||
            data.result?.name || data.result?.nameUser || data.result?.nickname ||
            data.data?.name || data.data?.nickname;
          if (nickname) {
            return NextResponse.json({ success: true, nickname });
          }
        }
      } catch { /* fallback to default APIs */ }
    }

    // Use default free APIs
    const result = await lookupMLAccount(cleanUserId, cleanZoneId);

    if (result.success) {
      // Sanitize nickname from external API — strip HTML/script tags
      const safeNickname = (result.nickname || "").replace(/<[^>]*>/g, "").slice(0, 100);
      return NextResponse.json({ success: true, nickname: safeNickname });
    }

    return NextResponse.json({ error: result.error || "Akun tidak ditemukan" }, { status: 404 });
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 });
  }
}
