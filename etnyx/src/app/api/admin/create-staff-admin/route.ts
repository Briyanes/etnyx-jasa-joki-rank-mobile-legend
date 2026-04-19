import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createAdminClient } from "@/lib/supabase-server";

export async function POST() {
  try {
    const password = "etnyx_admin_2026";
    const hash = bcrypt.hashSync(password, 10);

    const supabase = await createAdminClient();

    // Check if admin exists
    const { data: existing } = await supabase
      .from("staff_users")
      .select("id")
      .eq("email", "admin@etnyx.com")
      .single();

    if (existing) {
      // Update existing admin password
      const { data, error } = await supabase
        .from("staff_users")
        .update({ password_hash: hash })
        .eq("email", "admin@etnyx.com")
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json({
        success: true,
        message: "Admin password updated successfully",
        user: { email: data.email, name: data.name, role: data.role }
      });
    }

    // Create new admin user
    const { data, error } = await supabase
      .from("staff_users")
      .insert({
        email: "admin@etnyx.com",
        password_hash: hash,
        name: "Admin",
        role: "admin",
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "Admin staff user created successfully",
      user: { email: data.email, name: data.name, role: data.role }
    });
  } catch (error) {
    console.error("Create admin error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
