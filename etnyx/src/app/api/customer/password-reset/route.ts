import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { sendPasswordResetEmail } from "@/lib/email";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://etnyx.com";

// POST - Request password reset (send email) or reset password (with token)
export async function POST(request: Request) {
  try {
    const { action, email, token, newPassword } = await request.json();

    if (action === "request") {
      // Request password reset — send email with token
      if (!email) {
        return NextResponse.json({ error: "Email diperlukan" }, { status: 400 });
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json({ error: "Format email tidak valid" }, { status: 400 });
      }

      const supabase = await createAdminClient();
      const { data: customer } = await supabase
        .from("customers")
        .select("id, email, name")
        .eq("email", email.toLowerCase())
        .single();

      // Always return success to prevent email enumeration
      if (!customer) {
        return NextResponse.json({ success: true, message: "Jika email terdaftar, link reset akan dikirim" });
      }

      // Generate secure token
      const resetToken = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

      // Store token in database
      await supabase.from("password_resets").upsert(
        {
          customer_id: customer.id,
          token: resetToken,
          expires_at: expiresAt,
          used: false,
        },
        { onConflict: "customer_id" }
      );

      // Send email
      const resetUrl = `${SITE_URL}/reset-password?token=${resetToken}`;
      await sendPasswordResetEmail(customer.email, customer.name || "Customer", resetUrl);

      return NextResponse.json({ success: true, message: "Jika email terdaftar, link reset akan dikirim" });

    } else if (action === "reset") {
      // Reset password with token
      if (!token || !newPassword) {
        return NextResponse.json({ error: "Token dan password baru diperlukan" }, { status: 400 });
      }

      if (newPassword.length < 6) {
        return NextResponse.json({ error: "Password minimal 6 karakter" }, { status: 400 });
      }

      const supabase = await createAdminClient();

      // Find valid token
      const { data: resetData } = await supabase
        .from("password_resets")
        .select("id, customer_id, expires_at, used")
        .eq("token", token)
        .single();

      if (!resetData) {
        return NextResponse.json({ error: "Token tidak valid" }, { status: 400 });
      }

      if (resetData.used) {
        return NextResponse.json({ error: "Token sudah digunakan" }, { status: 400 });
      }

      if (new Date(resetData.expires_at) < new Date()) {
        return NextResponse.json({ error: "Token sudah kedaluwarsa" }, { status: 400 });
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(newPassword, 12);

      // Update password
      await supabase
        .from("customers")
        .update({ password_hash: passwordHash })
        .eq("id", resetData.customer_id);

      // Mark token as used
      await supabase
        .from("password_resets")
        .update({ used: true })
        .eq("id", resetData.id);

      return NextResponse.json({ success: true, message: "Password berhasil direset" });

    } else {
      return NextResponse.json({ error: "Action tidak valid" }, { status: 400 });
    }
  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 });
  }
}
