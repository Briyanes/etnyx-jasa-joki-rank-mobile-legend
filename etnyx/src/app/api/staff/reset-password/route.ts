import { NextRequest, NextResponse } from "next/server";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { createAdminClient } from "@/lib/supabase-server";

function getJwtSecret() {
  const secret = process.env.ADMIN_JWT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error("ADMIN_JWT_SECRET or SUPABASE_SERVICE_ROLE_KEY must be set");
  return new TextEncoder().encode(secret);
}

// POST /api/staff/reset-password — Request password reset (sends token via email)
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email wajib diisi" }, { status: 400 });
    }

    const supabase = await createAdminClient();
    const { data: user } = await supabase
      .from("staff_users")
      .select("id, email, name, is_active")
      .eq("email", email.toLowerCase().trim())
      .eq("is_active", true)
      .single();

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({ success: true, message: "Jika email terdaftar, link reset akan dikirim." });
    }

    // Create reset token (valid 1 hour)
    const token = await new SignJWT({ id: user.id, email: user.email, type: "reset" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(getJwtSecret());

    // Try to send email via Resend
    const { data: settingsData } = await supabase.from("settings").select("value").eq("key", "integrations").single();
    const settings = settingsData?.value || {};

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000";
    const resetUrl = `${baseUrl}/admin?reset=${token}`;

    if (settings.resendApiKey) {
      try {
        const { Resend } = await import("resend");
        const resend = new Resend(settings.resendApiKey);
        await resend.emails.send({
          from: settings.resendFromEmail || "noreply@etnyx.com",
          to: user.email,
          subject: "Reset Password - ETNYX Staff",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #6366f1;">Reset Password 🔑</h2>
              <p>Halo <strong>${user.name}</strong>,</p>
              <p>Kamu meminta reset password untuk akun staff ETNYX. Klik tombol di bawah:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="background: #6366f1; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold;">Reset Password</a>
              </div>
              <p style="color: #666; font-size: 14px;">Link berlaku 1 jam. Jika kamu tidak meminta reset, abaikan email ini.</p>
              <p style="color: #999; font-size: 12px;">Token: ${token.substring(0, 20)}...</p>
            </div>
          `,
        });
      } catch (emailErr) {
        console.error("Failed to send reset email:", emailErr);
      }
    } else {
      // If no email service, log the token (dev only)
      console.log(`🔑 Reset token for ${user.email}: ${token}`);
    }

    return NextResponse.json({ success: true, message: "Jika email terdaftar, link reset akan dikirim." });
  } catch (err) {
    console.error("Reset password error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/staff/reset-password — Execute password reset with token
export async function PUT(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json({ error: "Token dan password baru wajib diisi" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password minimal 6 karakter" }, { status: 400 });
    }

    // Verify reset token
    let payload;
    try {
      const verified = await jwtVerify(token, getJwtSecret());
      payload = verified.payload as { id: string; email: string; type: string };
    } catch {
      return NextResponse.json({ error: "Token tidak valid atau sudah expired" }, { status: 401 });
    }

    if (payload.type !== "reset") {
      return NextResponse.json({ error: "Token tidak valid" }, { status: 401 });
    }

    const supabase = await createAdminClient();
    const passwordHash = await bcrypt.hash(password, 12);

    const { error: updateError } = await supabase
      .from("staff_users")
      .update({ password_hash: passwordHash, updated_at: new Date().toISOString() })
      .eq("id", payload.id)
      .eq("is_active", true);

    if (updateError) {
      return NextResponse.json({ error: "Gagal update password" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Password berhasil diubah" });
  } catch (err) {
    console.error("Execute reset error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
