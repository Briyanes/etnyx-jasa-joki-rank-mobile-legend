import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createAdminClient();
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Find customer
    const { data: customer, error } = await supabase
      .from("customers")
      .select("id, name, is_verified")
      .eq("email", email)
      .single();

    if (error || !customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    if (customer.is_verified) {
      return NextResponse.json({ error: "Email already verified" }, { status: 400 });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");

    // Update customer with new token
    await supabase
      .from("customers")
      .update({ verification_token: verificationToken })
      .eq("id", customer.id);

    // In production, send email here using Resend, SendGrid, etc.
    // For now, we'll return the verification link (for testing)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const verifyUrl = `${siteUrl}/api/customer/verify?token=${verificationToken}`;

    // TODO: Implement actual email sending
    // await sendVerificationEmail(email, customer.name, verifyUrl);

    console.log(`Verification link for ${email}: ${verifyUrl}`);

    return NextResponse.json({ 
      success: true, 
      message: "Verification email sent",
      // Remove this in production - only for testing
      ...(process.env.NODE_ENV === "development" && { verifyUrl })
    });
  } catch (error) {
    console.error("Resend verification error:", error);
    return NextResponse.json({ error: "Failed to send verification email" }, { status: 500 });
  }
}
