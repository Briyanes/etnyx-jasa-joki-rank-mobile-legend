import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SignJWT } from "jose";
import bcrypt from "bcryptjs";
import { createAdminClient } from "@/lib/supabase-server";
import { verifyStaff } from "@/lib/staff-auth";

function getJwtSecret() {
  const secret = process.env.ADMIN_JWT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error("ADMIN_JWT_SECRET or SUPABASE_SERVICE_ROLE_KEY must be set");
  return new TextEncoder().encode(secret);
}

// Rate limit: 5 attempts per 15 minutes per IP
const staffLoginRateLimit = new Map<string, number[]>();
function checkLoginRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 15 * 60_000;
  const maxAttempts = 5;
  const timestamps = (staffLoginRateLimit.get(ip) || []).filter((t) => now - t < windowMs);
  if (timestamps.length >= maxAttempts) return false;
  timestamps.push(now);
  staffLoginRateLimit.set(ip, timestamps);
  return true;
}

// POST /api/staff/auth — Login
export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!checkLoginRateLimit(ip)) {
    return NextResponse.json({ error: "Terlalu banyak percobaan login. Coba lagi dalam 15 menit." }, { status: 429 });
  }
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email dan password wajib diisi" }, { status: 400 });
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Format email tidak valid" }, { status: 400 });
    }

    const supabase = await createAdminClient();
    const { data: user, error } = await supabase
      .from("staff_users")
      .select("*")
      .eq("email", email.toLowerCase().trim())
      .eq("is_active", true)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: "Email atau password salah" }, { status: 401 });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return NextResponse.json({ error: "Email atau password salah" }, { status: 401 });
    }

    // Update last login
    await supabase
      .from("staff_users")
      .update({ last_login_at: new Date().toISOString() })
      .eq("id", user.id);

    // Create JWT with staff info
    const token = await new SignJWT({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24h")
      .sign(getJwtSecret());

    // Set both cookies for backwards compatibility
    const cookieStore = await cookies();
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      maxAge: 60 * 60 * 24,
      path: "/",
    };

    cookieStore.set("staff_token", token, cookieOptions);
    // Also set admin_token so existing admin API routes still work
    if (user.role === "admin") {
      cookieStore.set("admin_token", token, cookieOptions);
    }

    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (error) {
    console.error("Staff login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET /api/staff/auth — Get current user
export async function GET() {
  const { authenticated, user, error } = await verifyStaff();
  if (!authenticated || !user) return error;

  return NextResponse.json({ user });
}

// DELETE /api/staff/auth — Logout
export async function DELETE() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("staff_token");
    cookieStore.delete("admin_token");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
