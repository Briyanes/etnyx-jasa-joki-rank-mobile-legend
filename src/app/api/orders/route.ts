import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { calculatePrice } from "@/utils/helpers";
import type { RankTier } from "@/types";

// Endpoint publik: customer membuat order dari halaman checkout
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      username,
      game_id,
      whatsapp,
      email,
      current_rank,
      target_rank,
      is_express = false,
      is_premium = false,
      promo_code,
      referral_code,
    } = body;

    if (!username || !game_id || !current_rank || !target_rank) {
      return NextResponse.json({ error: "Field wajib: username, game_id, current_rank, target_rank" }, { status: 400 });
    }

    const supabase = await createAdminClient();

    // Hitung harga server-side (tidak percaya harga dari client)
    const basePrice = calculatePrice(current_rank as RankTier, target_rank as RankTier, is_express, is_premium);

    if (basePrice <= 0) {
      return NextResponse.json({ error: "Rank target harus lebih tinggi dari rank sekarang" }, { status: 400 });
    }

    let totalPrice = basePrice;
    let packageName = "Standard";
    if (is_express && is_premium) packageName = "Express Premium";
    else if (is_express) packageName = "Express";
    else if (is_premium) packageName = "Premium";

    // Validasi & terapkan promo/referral jika ada
    if (promo_code) {
      const { data: promo } = await supabase
        .from("promo_codes")
        .select("*")
        .eq("code", promo_code.toUpperCase())
        .eq("is_active", true)
        .single();

      if (promo) {
        const discount =
          promo.type === "percentage"
            ? Math.round(basePrice * promo.value / 100)
            : promo.value;
        totalPrice = Math.max(0, totalPrice - discount);
      }
    }

    if (referral_code && !promo_code) {
      const { data: referrer } = await supabase
        .from("customers")
        .select("id")
        .eq("referral_code", referral_code.toUpperCase())
        .single();

      if (referrer) {
        const refDiscount = Math.round(basePrice * 0.1); // 10% diskon referral
        totalPrice = Math.max(0, totalPrice - refDiscount);
      }
    }

    // Buat order ID unik
    const orderId = `ETX-${Date.now().toString(36).toUpperCase()}`;

    // Cari customer_id jika ada akun terdaftar
    let customerId: string | null = null;
    if (email) {
      const { data: customer } = await supabase
        .from("customers")
        .select("id")
        .eq("email", email.toLowerCase())
        .single();
      if (customer) customerId = customer.id;
    }

    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        order_id: orderId,
        username,
        game_id,
        whatsapp: whatsapp || null,
        current_rank,
        target_rank,
        package: packageName,
        is_express,
        is_premium,
        base_price: basePrice,
        total_price: totalPrice,
        status: "pending",
        payment_status: "unpaid",
        customer_id: customerId,
      })
      .select()
      .single();

    if (error) {
      console.error("Order create error:", error);
      return NextResponse.json({ error: "Gagal membuat order" }, { status: 500 });
    }

    return NextResponse.json({ success: true, order_id: order.order_id, total_price: totalPrice }, { status: 201 });
  } catch (error) {
    console.error("Public order error:", error);
    return NextResponse.json({ error: "Gagal membuat order" }, { status: 500 });
  }
}
