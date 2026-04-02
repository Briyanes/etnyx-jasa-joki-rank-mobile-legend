import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { NextResponse } from "next/server";

function getAdminJwtSecret() {
  const secret = process.env.ADMIN_JWT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) {
    throw new Error("ADMIN_JWT_SECRET or SUPABASE_SERVICE_ROLE_KEY must be set");
  }
  return new TextEncoder().encode(secret);
}

export async function verifyAdmin(): Promise<{ authenticated: boolean; error?: NextResponse }> {
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

    return { authenticated: true };
  } catch {
    return {
      authenticated: false,
      error: NextResponse.json({ error: "Invalid token" }, { status: 401 }),
    };
  }
}
