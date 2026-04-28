import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { verifyAdmin } from "@/lib/admin-auth";

// GET - Export orders as CSV
export async function GET(request: NextRequest) {
  try {
    const admin = await verifyAdmin();
    if (!admin.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const dateFrom = searchParams.get("from");
    const dateTo = searchParams.get("to");

    const supabase = await createAdminClient();

    let query = supabase
      .from("orders")
      .select("order_id, username, game_id, current_rank, target_rank, current_star, target_star, package, package_title, total_price, base_price, promo_discount, tier_discount, promo_code, status, progress, payment_method, payment_status, is_express, is_premium, whatsapp, customer_email, notes, hero_request, created_at, updated_at, paid_at")
      .order("created_at", { ascending: false });

    if (status && status !== "all") {
      query = query.eq("status", status);
    }
    if (dateFrom) {
      query = query.gte("created_at", dateFrom);
    }
    if (dateTo) {
      query = query.lte("created_at", `${dateTo}T23:59:59.999Z`);
    }

    const { data: orders, error } = await query;

    if (error) {
      console.error("Export error:", error);
      return NextResponse.json({ error: "Failed to export" }, { status: 500 });
    }

    if (!orders || orders.length === 0) {
      return NextResponse.json({ error: "No orders found" }, { status: 404 });
    }

    // Build CSV
    const headers = [
      "Order ID", "Username", "Game ID", "Current Rank", "Target Rank", "Current Star", "Target Star",
      "Package", "Package Title", "Total Price", "Base Price", "Promo Discount", "Tier Discount",
      "Promo Code", "Status", "Progress", "Payment Method", "Payment Status",
      "Express", "Premium", "WhatsApp", "Email", "Notes", "Hero Request",
      "Created At", "Updated At", "Paid At",
    ];

    const escapeCSV = (val: unknown): string => {
      if (val === null || val === undefined) return "";
      const str = String(val);
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = orders.map((o) => [
      o.order_id, o.username, o.game_id, o.current_rank, o.target_rank, o.current_star, o.target_star,
      o.package, o.package_title, o.total_price, o.base_price, o.promo_discount, o.tier_discount,
      o.promo_code, o.status, o.progress, o.payment_method, o.payment_status,
      o.is_express ? "Yes" : "No", o.is_premium ? "Yes" : "No",
      o.whatsapp, o.customer_email, o.notes, o.hero_request,
      o.created_at, o.updated_at, o.paid_at,
    ].map(escapeCSV).join(","));

    const csv = [headers.join(","), ...rows].join("\n");
    const bom = "\uFEFF"; // UTF-8 BOM for Excel compatibility

    const filename = `etnyx-orders-${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(bom + csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
