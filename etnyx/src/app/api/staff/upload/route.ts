import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { verifyStaff } from "@/lib/staff-auth";

// POST /api/staff/upload — Upload screenshot to Supabase Storage
export async function POST(request: NextRequest) {
  const { authenticated, user, error } = await verifyStaff(["worker", "lead", "admin"]);
  if (!authenticated || !user) return error;

  const formData = await request.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json({ error: "File wajib diupload" }, { status: 400 });
  }

  // Validate file type
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: "Hanya file JPG, PNG, atau WebP yang diizinkan" }, { status: 400 });
  }

  // Max 5MB
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "Ukuran file maksimal 5MB" }, { status: 400 });
  }

  const supabase = await createAdminClient();
  // Use MIME type for extension (don't trust user filename like "photo.jpg.exe")
  const mimeToExt: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
  const safeExt = mimeToExt[file.type] || "jpg";
  const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${safeExt}`;

  const { error: uploadError } = await supabase.storage
    .from("worker-screenshots")
    .upload(fileName, file, { contentType: file.type, upsert: false });

  if (uploadError) {
    console.error("Upload error:", uploadError);
    return NextResponse.json({ error: "Gagal upload file" }, { status: 500 });
  }

  const { data: urlData } = supabase.storage.from("worker-screenshots").getPublicUrl(fileName);

  return NextResponse.json({ success: true, url: urlData.publicUrl });
}
