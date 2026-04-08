import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase-server", () => ({
  createServerSupabase: vi.fn(),
}));

describe("GET /api/testimonials", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns testimonials array on success", async () => {
    const mockData = [
      { id: "1", name: "User A", rank: "Mythic", content: "Great service!", is_featured: true },
      { id: "2", name: "User B", rank: "Legend", content: "Fast boost", is_featured: false },
    ];
    const mockOrder = vi.fn().mockReturnValue({
      order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
    });
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({ order: mockOrder }),
    });
    const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });
    const { createServerSupabase } = await import("@/lib/supabase-server");
    vi.mocked(createServerSupabase).mockResolvedValue({ from: mockFrom } as never);

    const { GET } = await import("@/app/api/testimonials/route");
    const res = await GET();
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });

  it("returns empty array on error", async () => {
    const mockOrder = vi.fn().mockReturnValue({
      order: vi.fn().mockResolvedValue({ data: null, error: { message: "DB error" } }),
    });
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({ order: mockOrder }),
    });
    const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });
    const { createServerSupabase } = await import("@/lib/supabase-server");
    vi.mocked(createServerSupabase).mockResolvedValue({ from: mockFrom } as never);

    const { GET } = await import("@/app/api/testimonials/route");
    const res = await GET();
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data).toHaveLength(0);
  });
});
