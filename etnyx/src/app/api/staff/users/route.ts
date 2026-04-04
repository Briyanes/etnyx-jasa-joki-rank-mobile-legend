import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createAdminClient } from "@/lib/supabase-server";
import { verifyStaff } from "@/lib/staff-auth";

// GET /api/staff/users — List staff (admin + lead can view)
export async function GET() {
  const { authenticated, user, error } = await verifyStaff(["admin", "lead"]);
  if (!authenticated || !user) return error;

  const supabase = await createAdminClient();

  let query = supabase
    .from("staff_users")
    .select("id, email, name, role, phone, is_active, last_login_at, created_at")
    .order("created_at", { ascending: false });

  // Lead can only see workers
  if (user.role === "lead") {
    query = query.eq("role", "worker");
  }

  const { data, error: dbError } = await query;
  if (dbError) {
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }

  return NextResponse.json({ users: data || [] });
}

// POST /api/staff/users — Create staff user (admin only)
export async function POST(request: NextRequest) {
  const { authenticated, error } = await verifyStaff(["admin"]);
  if (!authenticated) return error;

  const body = await request.json();
  const { email, name, password, role, phone } = body;

  if (!email || !name || !password || !role) {
    return NextResponse.json({ error: "Email, nama, password, dan role wajib diisi" }, { status: 400 });
  }

  if (!["admin", "lead", "worker"].includes(role)) {
    return NextResponse.json({ error: "Role tidak valid" }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: "Password minimal 6 karakter" }, { status: 400 });
  }

  const supabase = await createAdminClient();

  // Check duplicate email
  const { data: existing } = await supabase
    .from("staff_users")
    .select("id")
    .eq("email", email.toLowerCase().trim())
    .single();

  if (existing) {
    return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const { data: newUser, error: createError } = await supabase
    .from("staff_users")
    .insert({
      email: email.toLowerCase().trim(),
      name,
      password_hash: passwordHash,
      role,
      phone: phone || null,
    })
    .select("id, email, name, role, phone, is_active, created_at")
    .single();

  if (createError) {
    console.error("Create staff error:", createError);
    return NextResponse.json({ error: "Gagal membuat user" }, { status: 500 });
  }

  return NextResponse.json({ success: true, user: newUser }, { status: 201 });
}

// PUT /api/staff/users — Update staff user (admin only)
export async function PUT(request: NextRequest) {
  const { authenticated, error } = await verifyStaff(["admin"]);
  if (!authenticated) return error;

  const body = await request.json();
  const { id, name, role, phone, is_active, password } = body;

  if (!id) {
    return NextResponse.json({ error: "User ID wajib" }, { status: 400 });
  }

  const supabase = await createAdminClient();

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (name !== undefined) updates.name = name;
  if (role !== undefined) updates.role = role;
  if (phone !== undefined) updates.phone = phone;
  if (is_active !== undefined) updates.is_active = is_active;
  if (password) updates.password_hash = await bcrypt.hash(password, 12);

  const { error: updateError } = await supabase
    .from("staff_users")
    .update(updates)
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: "Gagal update user" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// DELETE /api/staff/users — Deactivate staff user (admin only)
export async function DELETE(request: NextRequest) {
  const { authenticated, error } = await verifyStaff(["admin"]);
  if (!authenticated) return error;

  const { id } = await request.json();
  if (!id) {
    return NextResponse.json({ error: "User ID wajib" }, { status: 400 });
  }

  const supabase = await createAdminClient();
  const { error: deactivateError } = await supabase
    .from("staff_users")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (deactivateError) {
    return NextResponse.json({ error: "Gagal deactivate user" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
