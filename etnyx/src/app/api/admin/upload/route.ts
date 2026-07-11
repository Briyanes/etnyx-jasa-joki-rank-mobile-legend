import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit-log";
import { uploadFile } from "@/lib/storage";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(request: NextRequest) {
  const auth = await verifyAdmin();
  if (!auth.authenticated) return auth.error!;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const bucket = (formData.get("bucket") as string) || "portfolio";
    const ALLOWED_BUCKETS = ["portfolio", "booster-avatars", "payment-proofs", "submissions"];
    if (!ALLOWED_BUCKETS.includes(bucket)) {
      return NextResponse.json({ error: `Invalid bucket. Allowed: ${ALLOWED_BUCKETS.join(", ")}` }, { status: 400 });
    }

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPEG, PNG, WebP, GIF" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum 5MB" },
        { status: 400 }
      );
    }

    const result = await uploadFile(file, bucket, file.type);

    logAdminAction({ admin_email: auth.user!.email, action: "upload", resource_type: "file", details: `Uploaded file: ${result.path} to ${bucket} via ${result.provider}` });

    return NextResponse.json({ url: result.url, path: result.path, provider: result.provider });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}