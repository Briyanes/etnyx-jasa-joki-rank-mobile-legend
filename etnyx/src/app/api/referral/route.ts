import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

// Validate referral code
export async function POST(request: Request) {
  try {
    const { code, customerEmail, customerWhatsapp } = await request.json();

    if (!code) {
      return NextResponse.json({ valid: false, message: "Kode referral diperlukan" });
    }

    const sanitizedCode = code.replace(/[^a-zA-Z0-9-]/g, "").toUpperCase();
    
    const supabase = await createAdminClient();
    
    const { data: referrer, error } = await supabase
      .from("customers")
      .select("id, name, email, whatsapp, referral_code")
      .eq("referral_code", sanitizedCode)
      .single();

    if (error || !referrer) {
      return NextResponse.json({ valid: false, message: "Kode referral tidak valid" });
    }

    // Self-referral check: compare email AND whatsapp
    if (customerEmail && referrer.email && customerEmail.toLowerCase() === referrer.email.toLowerCase()) {
      return NextResponse.json({ valid: false, message: "Tidak bisa menggunakan kode referral sendiri" });
    }
    if (customerWhatsapp && referrer.whatsapp) {
      const cleanInput = customerWhatsapp.replace(/\D/g, "");
      const cleanReferrer = referrer.whatsapp.replace(/\D/g, "");
      // Normalize to compare: strip leading 62 or 0, then compare
      const normalizeWa = (wa: string) => wa.replace(/^(62|0)/, "");
      if (normalizeWa(cleanInput) === normalizeWa(cleanReferrer)) {
        return NextResponse.json({ valid: false, message: "Tidak bisa menggunakan kode referral sendiri" });
      }
    }

    // Check duplicate: has this whatsapp/email already used this referral?
    if (customerWhatsapp) {
      const cleanWa = customerWhatsapp.replace(/\D/g, "");
      const { data: existing } = await supabase
        .from("referrals")
        .select("id")
        .eq("referrer_id", referrer.id)
        .eq("referred_whatsapp", `+62${cleanWa}`)
        .limit(1);

      if (existing && existing.length > 0) {
        return NextResponse.json({ valid: false, message: "Kamu sudah pernah menggunakan kode referral ini" });
      }
    }

    return NextResponse.json({
      valid: true,
      referrerId: referrer.id,
      referrerName: referrer.name,
      discount: 10, // 10% discount for referred user
      message: `Kode referral dari ${referrer.name} berhasil! Kamu dapat diskon 10%`,
    });
  } catch {
    return NextResponse.json({ valid: false, message: "Gagal memvalidasi kode referral" });
  }
}

// Get referral stats for a customer
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("customerId");

    if (!customerId) {
      return NextResponse.json({ error: "Customer ID diperlukan" }, { status: 400 });
    }

    // Sanitize customerId to prevent injection
    const sanitizedId = customerId.replace(/[^a-zA-Z0-9-]/g, "");
    if (!sanitizedId) {
      return NextResponse.json({ error: "Invalid customer ID" }, { status: 400 });
    }

    const supabase = await createAdminClient();

    // Get referral stats
    const { data: referrals, error } = await supabase
      .from("referrals")
      .select(`
        id,
        reward_value,
        reward_given,
        created_at,
        referred:referred_id (name, email)
      `)
      .eq("referrer_id", sanitizedId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Referral fetch error:", error);
      return NextResponse.json({ referrals: [], totalEarned: 0 });
    }

    const totalEarned = (referrals || [])
      .filter(r => r.reward_given)
      .reduce((sum, r) => sum + r.reward_value, 0);

    return NextResponse.json({
      referrals: referrals || [],
      totalReferrals: referrals?.length || 0,
      totalEarned,
    });
  } catch {
    return NextResponse.json({ referrals: [], totalEarned: 0 });
  }
}
