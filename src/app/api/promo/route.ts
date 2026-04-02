import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

export async function POST(request: Request) {
  try {
    const { code, orderAmount } = await request.json();

    if (!code || typeof orderAmount !== "number") {
      return NextResponse.json({ valid: false, message: "Data tidak lengkap" }, { status: 400 });
    }

    // Sanitize code
    const sanitizedCode = code.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

    const supabase = await createAdminClient();
    const { data, error } = await supabase.rpc("validate_promo_code", {
      p_code: sanitizedCode,
      p_order_amount: orderAmount,
    });

    if (error) {
      // If function doesn't exist, return simple error
      return NextResponse.json({ valid: false, message: "Sistem promo belum aktif" });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ valid: false, message: "Kode promo tidak valid" });
    }

    const result = data[0];
    return NextResponse.json({
      valid: result.valid,
      promoId: result.promo_id,
      discountType: result.discount_type,
      discountValue: result.discount_value,
      maxDiscount: result.max_discount,
      calculatedDiscount: result.calculated_discount,
      message: result.message,
    });
  } catch {
    return NextResponse.json({ valid: false, message: "Gagal memvalidasi promo" }, { status: 500 });
  }
}
