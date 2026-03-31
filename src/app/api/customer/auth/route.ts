import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "etnyx-customer-secret-key-2026"
);

// Simple hash function (in production use bcrypt)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "etnyx-salt");
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const inputHash = await hashPassword(password);
  return inputHash === hash;
}

// POST - Register or Login
export async function POST(request: Request) {
  try {
    const { action, email, password, name, whatsapp } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email dan password diperlukan" }, { status: 400 });
    }

    const supabase = await createAdminClient();

    if (action === "register") {
      // Check if email exists
      const { data: existing } = await supabase
        .from("customers")
        .select("id")
        .eq("email", email.toLowerCase())
        .single();

      if (existing) {
        return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 400 });
      }

      // Hash password and create user
      const passwordHash = await hashPassword(password);
      
      const { data: customer, error } = await supabase
        .from("customers")
        .insert({
          email: email.toLowerCase(),
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
        .setExpirationTime("7d")
        .sign(JWT_SECRET);

      // Set cookie
      const cookieStore = await cookies();
      cookieStore.set("customer_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/",
      });

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
        .setExpirationTime("7d")
        .sign(JWT_SECRET);

      // Set cookie
      const cookieStore = await cookies();
      cookieStore.set("customer_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      });

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

    const { payload } = await jwtVerify(token, JWT_SECRET);
    
    const supabase = await createAdminClient();
    const { data: customer } = await supabase
      .from("customers")
      .select("id, email, name, whatsapp, referral_code, total_orders, total_spent, created_at")
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
