import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { verifyAdmin } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit-log";

export async function GET(request: NextRequest) {
  const auth = await verifyAdmin();
  if (!auth.authenticated) return auth.error!;
  try {
    const supabase = await createAdminClient();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "orders";

    let data: Record<string, unknown>[] = [];
    let filename = "";

    switch (type) {
      case "orders": {
        const { data: orders } = await supabase
          .from("orders")
          .select("id, order_id, username, game_id, current_rank, target_rank, package, package_title, is_express, is_premium, total_price, status, progress, current_progress_rank, login_method, hero_request, customer_email, whatsapp, promo_code, promo_discount, created_at, updated_at")
          .order("created_at", { ascending: false });
        data = orders || [];
        filename = `orders_${new Date().toISOString().split("T")[0]}.csv`;
        break;
      }
      case "customers": {
        const { data: customers } = await supabase
          .from("customers")
          .select("id, email, name, whatsapp, total_orders, total_spent, referral_code, created_at")
          .order("created_at", { ascending: false });
        data = customers || [];
        filename = `customers_${new Date().toISOString().split("T")[0]}.csv`;
        break;
      }
      case "testimonials": {
        const { data: testimonials } = await supabase
          .from("testimonials")
          .select("*")
          .order("created_at", { ascending: false });
        data = testimonials || [];
        filename = `testimonials_${new Date().toISOString().split("T")[0]}.csv`;
        break;
      }
      case "promo_codes": {
        const { data: promos } = await supabase
          .from("promo_codes")
          .select("*")
          .order("created_at", { ascending: false });
        data = promos || [];
        filename = `promo_codes_${new Date().toISOString().split("T")[0]}.csv`;
        break;
      }
      case "boosters": {
        const { data: boosters } = await supabase
          .from("boosters")
          .select("*")
          .order("created_at", { ascending: false });
        data = boosters || [];
        filename = `boosters_${new Date().toISOString().split("T")[0]}.csv`;
        break;
      }
      default:
        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    if (data.length === 0) {
      return NextResponse.json({ error: "No data found" }, { status: 404 });
    }

    // Convert to CSV
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header];
            // Handle values with commas or quotes
            if (value === null || value === undefined) return "";
            const str = String(value);
            if (str.includes(",") || str.includes('"') || str.includes("\n")) {
              return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
          })
          .join(",")
      ),
    ];
    const csv = csvRows.join("\n");

    logAdminAction({
      admin_email: auth.user!.email,
      action: "export_data",
      resource_type: "order",
      details: `Exported ${type} (${data.length} rows)`,
    });

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
