import { NextResponse, NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { logCustomerActivity } from "@/lib/activity-log";

// Rate limit: 10 attempts per 15 minutes per IP
const customerLoginRateLimit = new Map<string, number[]>();
function checkLoginRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 15 * 60_000;
  const maxAttempts = 10;
  const timestamps = (customerLoginRateLimit.get(ip) || []).filter((t) => now - t < windowMs);
  if (timestamps.length >= maxAttempts) return false;
  timestamps.push(now);
  customerLoginRateLimit.set(ip, timestamps);
  return true;
}

function getJwtSecret() {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is required.");
  }
  return new TextEncoder().encode(process.env.JWT_SECRET);
}

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  // Support legacy SHA-256 hashes (exactly 64 hex chars) for migration
  if (hash.length === 64 && /^[a-f0-9]{64}$/i.test(hash)) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + "etnyx-salt");
    const digest = await crypto.subtle.digest("SHA-256", data);
    const legacyHash = Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    if (legacyHash === hash) {
      return true;
    }
  }
  return bcrypt.compare(password, hash);
}

// POST - Register or Login
export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!checkLoginRateLimit(ip)) {
    return NextResponse.json({ error: "Terlalu banyak percobaan. Coba lagi dalam 15 menit." }, { status: 429 });
  }
  try {
    if (!process.env.JWT_SECRET) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const { action, email, password, name, whatsapp } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email dan password diperlukan" }, { status: 400 });
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Format email tidak valid" }, { status: 400 });
    }

    const supabase = await createAdminClient();

    if (action === "register") {
      // Check if email exists
      const cleanEmail = email.trim().toLowerCase();

      const { data: existing, error: existingErr } = await supabase
        .from("customers")
        .select("id")
        .eq("email", cleanEmail)
        .single();

      // PGRST116 = no rows found (expected for new registration)
      if (existingErr && existingErr.code !== "PGRST116") {
        console.error("Auth check error:", existingErr);
        return NextResponse.json({ error: "Terjadi kesalahan. Coba lagi." }, { status: 500 });
      }

      if (existing) {
        return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 400 });
      }

      // Hash password and create user
      const passwordHash = await hashPassword(password);
      
      const { data: customer, error } = await supabase
        .from("customers")
        .insert({
          email: cleanEmail,
          password_hash: passwordHash,
          name: name || email.split("@")[0],
          whatsapp: whatsapp || null,
        })
        .select("id, email, name, referral_code")
        .single();

      if (error) {
        console.error("Register error:", error);
        return NextResponse.json({ error: "Gagal mendaftar" }, { status: 500 });
      }

      // Create JWT
      const token = await new SignJWT({ 
        id: customer.id, 
        email: customer.email,
        name: customer.name 
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("7d")
        .sign(getJwtSecret());

      // Set cookie
      const cookieStore = await cookies();
      cookieStore.set("customer_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/",
      });

      // Log activity
      logCustomerActivity(customer.id, "register", { email: customer.email }, request);

      return NextResponse.json({ 
        success: true, 
        customer: {
          id: customer.id,
          email: customer.email,
          name: customer.name,
          referral_code: customer.referral_code,
        }
      });

    } else {
      // Login
      const { data: customer, error } = await supabase
        .from("customers")
        .select("id, email, name, password_hash, referral_code, total_orders, total_spent")
        .eq("email", email.toLowerCase())
        .single();

      if (error || !customer) {
        return NextResponse.json({ error: "Email atau password salah" }, { status: 401 });
      }

      const isValid = await verifyPassword(password, customer.password_hash);
      if (!isValid) {
        return NextResponse.json({ error: "Email atau password salah" }, { status: 401 });
      }

      // Update last login
      await supabase
        .from("customers")
        .update({ last_login_at: new Date().toISOString() })
        .eq("id", customer.id);

      // Create JWT
      const token = await new SignJWT({ 
        id: customer.id, 
        email: customer.email,
        name: customer.name 
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("7d")
        .sign(getJwtSecret());

      // Set cookie
      const cookieStore = await cookies();
      cookieStore.set("customer_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      });

      // Log activity
      logCustomerActivity(customer.id, "login", { email: customer.email }, request);

      return NextResponse.json({ 
        success: true, 
        customer: {
          id: customer.id,
          email: customer.email,
          name: customer.name,
          referral_code: customer.referral_code,
          total_orders: customer.total_orders,
          total_spent: customer.total_spent,
        }
      });
    }
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 });
  }
}

// GET - Verify token / Get current user
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("customer_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, getJwtSecret());
    
    const supabase = await createAdminClient();
    const { data: customer } = await supabase
      .from("customers")
      .select("id, email, name, whatsapp, referral_code, total_orders, total_spent, reward_points, reward_tier, lifetime_points, created_at")
      .eq("id", payload.id)
      .single();

    if (!customer) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    return NextResponse.json({ customer });
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}

// DELETE - Logout
export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete("customer_token");
  return NextResponse.json({ success: true });
}
