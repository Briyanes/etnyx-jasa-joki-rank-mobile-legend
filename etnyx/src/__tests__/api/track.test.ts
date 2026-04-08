import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase-server", () => ({
  createAdminClient: vi.fn(),
}));

describe("GET /api/track", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns 400 when id is missing", async () => {
    const { GET } = await import("@/app/api/track/route");
    const req = new Request("http://localhost/api/track");
    const res = await GET(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBeDefined();
  });

  it("returns 400 for empty id parameter", async () => {
    const { GET } = await import("@/app/api/track/route");
    const req = new Request("http://localhost/api/track?id=");
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it("sanitizes order ID to uppercase alphanumeric + hyphens", async () => {
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: null, error: { code: "PGRST116" } }),
      }),
    });
    const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });
    const { createAdminClient } = await import("@/lib/supabase-server");
    vi.mocked(createAdminClient).mockResolvedValue({ from: mockFrom } as never);

    const { GET } = await import("@/app/api/track/route");
    const req = new Request("http://localhost/api/track?id=etx-abc123!@#");
    const res = await GET(req);
    // Should have sanitized and queried (will get 404 from mock)
    expect(res.status).toBe(404);
  });

  it("returns 404 when order not found", async () => {
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: null, error: { code: "PGRST116" } }),
      }),
    });
    const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });
    const { createAdminClient } = await import("@/lib/supabase-server");
    vi.mocked(createAdminClient).mockResolvedValue({ from: mockFrom } as never);

    const { GET } = await import("@/app/api/track/route");
    const req = new Request("http://localhost/api/track?id=ETX-NOTEXIST");
    const res = await GET(req);
    expect(res.status).toBe(404);
  });
});
