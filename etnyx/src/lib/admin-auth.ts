import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { NextResponse } from "next/server";

function getAdminJwtSecret() {
  // SECURITY FIX (K5): ADMIN_JWT_SECRET must be set independently.
  // Never fall back to SUPABASE_SERVICE_ROLE_KEY — if that key leaks,
  // an attacker could forge admin JWTs. Each secret must be isolated.
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "ADMIN_JWT_SECRET must be set and at least 32 characters long. " +
      "Generate with: openssl rand -hex 32"
    );
  }
  return new TextEncoder().encode(secret);
}

export interface AdminPayload {
  email: string;
  role: string;
}

export async function verifyAdmin(): Promise<{ authenticated: boolean; user?: AdminPayload; error?: NextResponse }> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_token")?.value;

    if (!token) {
      return {
        authenticated: false,
        error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      };
    }

    const { payload } = await jwtVerify(token, getAdminJwtSecret());

    if (payload.role !== "admin") {
      return {
        authenticated: false,
        error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
      };
    }

    return {
      authenticated: true,
      user: {
        email: payload.email as string,
        role: payload.role as string,
      },
    };
  } catch {
    return {
      authenticated: false,
      error: NextResponse.json({ error: "Invalid token" }, { status: 401 }),
    };
  }
}
