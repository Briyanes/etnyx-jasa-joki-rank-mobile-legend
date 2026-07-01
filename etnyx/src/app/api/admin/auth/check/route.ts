import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";

/**
 * GET /api/admin/auth/check
 * Lightweight endpoint to verify if the current session is an admin.
 * Returns 200 if authenticated, 401 otherwise.
 * Used by client-side components (e.g. calculator) to detect admin mode.
 */
export async function GET() {
  const { authenticated, user } = await verifyAdmin();

  if (!authenticated) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({ authenticated: true, user });
}