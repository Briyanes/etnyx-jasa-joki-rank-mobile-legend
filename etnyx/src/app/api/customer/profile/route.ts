import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

function getJwtSecret() {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is required.");
  }
  return new TextEncoder().encode(process.env.JWT_SECRET);
}

async function getCustomerId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("customer_token")?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, getJwtSecret());
    return payload.id as string;
  } catch {
    return null;
  }
}

// GET - Get profile
export async function GET() {
  const customerId = await getCustomerId();
  if (!customerId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const supabase = await createAdminClient();
  const { data: customer } = await supabase
    .from("customers")
    .select("id, email, name, whatsapp, referral_code, total_orders, total_spent, reward_points, reward_tier, lifetime_points, created_at")
    .eq("id", customerId)
    .single();

  if (!customer) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ customer });
}

// PATCH - Update profile (name, whatsapp, password)
export async function PATCH(request: Request) {
  const customerId = await getCustomerId();
  if (!customerId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const { name, whatsapp, currentPassword, newPassword } = await request.json();

    const supabase = await createAdminClient();

    // Get current customer data
    const { data: customer } = await supabase
      .from("customers")
      .select("id, password_hash")
      .eq("id", customerId)
      .single();

    if (!customer) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updates: Record<string, unknown> = {};

    // Update name
    if (name !== undefined) {
      const sanitized = String(name).replace(/<[^>]*>/g, "").trim().slice(0, 100);
      if (!sanitized) {
        return NextResponse.json({ error: "Nama tidak boleh kosong" }, { status: 400 });
      }
      updates.name = sanitized;
    }

    // Update whatsapp
    if (whatsapp !== undefined) {
      const clean = String(whatsapp).replace(/\D/g, "");
      if (clean && (clean.length < 9 || clean.length > 15)) {
        return NextResponse.json({ error: "Nomor WhatsApp tidak valid" }, { status: 400 });
      }
      updates.whatsapp = clean ? (clean.startsWith("62") ? `+${clean}` : `+62${clean}`) : null;
    }

    // Update password
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: "Password lama diperlukan" }, { status: 400 });
      }
      if (newPassword.length < 6) {
        return NextResponse.json({ error: "Password baru minimal 6 karakter" }, { status: 400 });
      }

      const isValid = await bcrypt.compare(currentPassword, customer.password_hash);
      if (!isValid) {
        return NextResponse.json({ error: "Password lama salah" }, { status: 401 });
      }

      updates.password_hash = await bcrypt.hash(newPassword, 12);
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Tidak ada data yang diubah" }, { status: 400 });
    }

    const { error: updateError } = await supabase
      .from("customers")
      .update(updates)
      .eq("id", customerId);

    if (updateError) {
      console.error("Profile update error:", updateError);
      return NextResponse.json({ error: "Gagal mengupdate profil" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Profil berhasil diupdate" });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 });
  }
}
