import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Supabase before importing route
vi.mock("@/lib/supabase-server", () => ({
  createAdminClient: vi.fn(),
}));

describe("POST /api/promo", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns 400 when code is missing", async () => {
    const { POST } = await import("@/app/api/promo/route");
    const req = new Request("http://localhost/api/promo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderAmount: 100000 }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.valid).toBe(false);
  });

  it("returns 400 when orderAmount is not a number", async () => {
    const { POST } = await import("@/app/api/promo/route");
    const req = new Request("http://localhost/api/promo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: "TEST10", orderAmount: "bukan angka" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.valid).toBe(false);
  });

  it("sanitizes promo code to uppercase alphanumeric", async () => {
    const mockRpc = vi.fn().mockResolvedValue({ data: [{ valid: true, promo_id: "1", discount_type: "percentage", discount_value: 10, max_discount: null, calculated_discount: 10000, message: "OK" }], error: null });
    const { createAdminClient } = await import("@/lib/supabase-server");
    vi.mocked(createAdminClient).mockResolvedValue({ rpc: mockRpc } as never);

    const { POST } = await import("@/app/api/promo/route");
    const req = new Request("http://localhost/api/promo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: "test-10!", orderAmount: 100000 }),
    });

    await POST(req);
    expect(mockRpc).toHaveBeenCalledWith("validate_promo_code", {
      p_code: "TEST10",
      p_order_amount: 100000,
    });
  });

  it("returns valid promo result on success", async () => {
    const mockResult = {
      valid: true,
      promo_id: "uuid-123",
      discount_type: "percentage",
      discount_value: 10,
      max_discount: 50000,
      calculated_discount: 15000,
      message: "Promo applied",
    };
    const mockRpc = vi.fn().mockResolvedValue({ data: [mockResult], error: null });
    const { createAdminClient } = await import("@/lib/supabase-server");
    vi.mocked(createAdminClient).mockResolvedValue({ rpc: mockRpc } as never);

    const { POST } = await import("@/app/api/promo/route");
    const req = new Request("http://localhost/api/promo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: "DISKON10", orderAmount: 150000 }),
    });

    const res = await POST(req);
    const data = await res.json();
    expect(data.valid).toBe(true);
    expect(data.calculatedDiscount).toBe(15000);
    expect(data.discountType).toBe("percentage");
  });

  it("handles empty RPC result", async () => {
    const mockRpc = vi.fn().mockResolvedValue({ data: [], error: null });
    const { createAdminClient } = await import("@/lib/supabase-server");
    vi.mocked(createAdminClient).mockResolvedValue({ rpc: mockRpc } as never);

    const { POST } = await import("@/app/api/promo/route");
    const req = new Request("http://localhost/api/promo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: "EXPIRED", orderAmount: 100000 }),
    });

    const res = await POST(req);
    const data = await res.json();
    expect(data.valid).toBe(false);
    expect(data.message).toContain("tidak valid");
  });

  it("handles RPC error gracefully", async () => {
    const mockRpc = vi.fn().mockResolvedValue({ data: null, error: { message: "function not found" } });
    const { createAdminClient } = await import("@/lib/supabase-server");
    vi.mocked(createAdminClient).mockResolvedValue({ rpc: mockRpc } as never);

    const { POST } = await import("@/app/api/promo/route");
    const req = new Request("http://localhost/api/promo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: "TEST", orderAmount: 100000 }),
    });

    const res = await POST(req);
    const data = await res.json();
    expect(data.valid).toBe(false);
    expect(data.message).toBe("Sistem promo belum aktif");
  });
});
