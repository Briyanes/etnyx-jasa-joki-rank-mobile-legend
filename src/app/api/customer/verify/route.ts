import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createAdminClient();
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.redirect(new URL("/login?error=invalid_token", request.url));
    }

    // Find customer with this verification token
    const { data: customer, error } = await supabase
      .from("customers")
      .select("id, email, is_verified")
      .eq("verification_token", token)
      .single();

    if (error || !customer) {
      return NextResponse.redirect(new URL("/login?error=invalid_token", request.url));
    }

    if (customer.is_verified) {
      return NextResponse.redirect(new URL("/login?message=already_verified", request.url));
    }

    // Verify the customer
    const { error: updateError } = await supabase
      .from("customers")
      .update({ 
        is_verified: true,
        verification_token: null,
        verified_at: new Date().toISOString()
      })
      .eq("id", customer.id);

    if (updateError) {
      return NextResponse.redirect(new URL("/login?error=verification_failed", request.url));
    }

    return NextResponse.redirect(new URL("/login?message=verified", request.url));
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.redirect(new URL("/login?error=verification_failed", request.url));
  }
}
