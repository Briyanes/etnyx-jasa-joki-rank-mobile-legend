import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { NextResponse } from "next/server";

export type StaffRole = "admin" | "lead" | "worker";

export interface StaffPayload {
  id: string;
  email: string;
  name: string;
  role: StaffRole;
}

function getJwtSecret() {
  const secret = process.env.ADMIN_JWT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error("ADMIN_JWT_SECRET or SUPABASE_SERVICE_ROLE_KEY must be set");
  return new TextEncoder().encode(secret);
}

/**
 * Verify staff authentication and return user payload.
 * Optionally restrict to specific roles.
 */
export async function verifyStaff(
  allowedRoles?: StaffRole[]
): Promise<{ authenticated: boolean; user?: StaffPayload; error?: NextResponse }> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("staff_token")?.value || cookieStore.get("admin_token")?.value;

    if (!token) {
      return {
        authenticated: false,
        error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      };
    }

    const { payload } = await jwtVerify(token, getJwtSecret());
    const user: StaffPayload = {
      id: payload.id as string,
      email: payload.email as string,
      name: payload.name as string,
      role: payload.role as StaffRole,
    };

    // Check role authorization
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      return {
        authenticated: false,
        error: NextResponse.json({ error: "Forbidden: insufficient permissions" }, { status: 403 }),
      };
    }

    return { authenticated: true, user };
  } catch {
    return {
      authenticated: false,
      error: NextResponse.json({ error: "Invalid or expired token" }, { status: 401 }),
    };
  }
}

/**
 * Shortcut: verify admin only (backwards compatible)
 */
export async function verifyAdmin() {
  return verifyStaff(["admin"]);
}
