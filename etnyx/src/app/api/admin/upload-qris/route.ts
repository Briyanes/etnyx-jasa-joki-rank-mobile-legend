import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";
import { uploadFileUpsert } from "@/lib/storage";

export async function POST(request: NextRequest) {
  const { authenticated, error: authError } = await verifyAdmin();
  if (!authenticated) return authError;

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // Validate file type
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: "Only JPG, PNG, WebP allowed" }, { status: 400 });
  }

  // Validate file size (5MB)
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
  }

  const ext = file.name.split(".").pop() || "png";
  const fileName = `qris-${Date.now()}.${ext}`;

  try {
    const result = await uploadFileUpsert(file, "payment-proofs", fileName, file.type);
    return NextResponse.json({ url: result.url, provider: result.provider });
  } catch (error) {
    console.error("QRIS upload error:", error);
    return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
  }
}