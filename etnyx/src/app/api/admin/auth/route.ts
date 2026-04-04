import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";

function getAdminJwtSecret() {
  const secret = process.env.ADMIN_JWT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) {
    throw new Error("ADMIN_JWT_SECRET or SUPABASE_SERVICE_ROLE_KEY must be set");
  }
  return new TextEncoder().encode(secret);
}

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // Validate credentials
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;

    if (!adminEmail) {
      console.error("ADMIN_EMAIL environment variable not set");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Prefer hashed password, fall back to plain for migration period
    if (adminPasswordHash) {
      // Bcrypt compare (timing-safe)
      const emailMatch = email === adminEmail;
      const passwordMatch = await bcrypt.compare(password || "", adminPasswordHash);
      if (!emailMatch || !passwordMatch) {
        return NextResponse.json(
          { error: "Invalid credentials" },
          { status: 401 }
        );
      }
    } else {
      console.error("ADMIN_PASSWORD_HASH must be set with a bcrypt hash");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Create JWT token
    const JWT_SECRET = getAdminJwtSecret();
    const token = await new SignJWT({ email, role: "admin" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24h")
      .sign(JWT_SECRET);

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });

    return NextResponse.json({ success: true, email });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("admin_token");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_token")?.value;

    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, getAdminJwtSecret());
    return NextResponse.json({
      authenticated: true,
      email: payload.email,
    });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
