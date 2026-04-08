import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/supabase-server", () => ({
  createServerSupabase: vi.fn(),
}));

describe("GET /api/settings", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns settings as key-value map", async () => {
    const mockData = [
      { key: "hero", value: { title: "ETNYX" } },
      { key: "social_links", value: { ig: "etnyx" } },
    ];
    const mockIn = vi.fn().mockResolvedValue({ data: mockData, error: null });
    const mockSelect = vi.fn().mockReturnValue({ in: mockIn });
    const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });
    const { createServerSupabase } = await import("@/lib/supabase-server");
    vi.mocked(createServerSupabase).mockResolvedValue({ from: mockFrom } as never);

    const { GET } = await import("@/app/api/settings/route");
    const req = new NextRequest("http://localhost/api/settings?keys=hero,social_links");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty("hero");
    expect(data).toHaveProperty("social_links");
  });

  it("filters keys against whitelist", async () => {
    const mockIn = vi.fn().mockResolvedValue({ data: [], error: null });
    const mockSelect = vi.fn().mockReturnValue({ in: mockIn });
    const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });
    const { createServerSupabase } = await import("@/lib/supabase-server");
    vi.mocked(createServerSupabase).mockResolvedValue({ from: mockFrom } as never);

    const { GET } = await import("@/app/api/settings/route");
    const req = new NextRequest("http://localhost/api/settings?keys=hero,secret_key,integrations");
    const res = await GET(req);
    expect(res.status).toBe(200);
  });

  it("returns cache headers", async () => {
    const mockIn = vi.fn().mockResolvedValue({ data: [], error: null });
    const mockSelect = vi.fn().mockReturnValue({ in: mockIn });
    const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });
    const { createServerSupabase } = await import("@/lib/supabase-server");
    vi.mocked(createServerSupabase).mockResolvedValue({ from: mockFrom } as never);

    const { GET } = await import("@/app/api/settings/route");
    const req = new NextRequest("http://localhost/api/settings?keys=hero");
    const res = await GET(req);
    const cacheHeader = res.headers.get("Cache-Control");
    expect(cacheHeader).toBeTruthy();
  });
});
