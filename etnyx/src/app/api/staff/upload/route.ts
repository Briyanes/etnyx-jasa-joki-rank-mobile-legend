import { NextRequest, NextResponse } from "next/server";
import { verifyStaff } from "@/lib/staff-auth";
import { uploadFile } from "@/lib/storage";

// POST /api/staff/upload — Upload screenshot to storage (R2 or Supabase)
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

  // Use MIME type for extension (don't trust user filename like "photo.jpg.exe")
  const mimeToExt: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
  const safeExt = mimeToExt[file.type] || "jpg";
  const customFilename = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${safeExt}`;

  try {
    const result = await uploadFile(file, "worker-screenshots", file.type, customFilename);
    return NextResponse.json({ success: true, url: result.url, provider: result.provider });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Gagal upload file" }, { status: 500 });
  }
}