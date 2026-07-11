import { createServiceClient } from "@/lib/supabase-server";
import { isR2Configured, uploadToR2, generateR2Key } from "@/lib/r2";

/**
 * Unified Storage Layer
 * 
 * Auto-detects R2 (Cloudflare) if configured, falls back to Supabase Storage.
 * This allows zero-downtime migration: set R2 env vars → uploads go to R2.
 * Unset R2 env vars → uploads fall back to Supabase Storage.
 */

export interface UploadResult {
  url: string;
  path: string;
  provider: "r2" | "supabase";
}

/**
 * Upload a file to storage (R2 if configured, otherwise Supabase Storage).
 * 
 * @param file - File or Buffer to upload
 * @param bucket - Supabase bucket name (used as R2 folder prefix for organization)
 * @param contentType - MIME type
 * @param customFilename - Optional custom filename (without extension)
 */
export async function uploadFile(
  file: File | Buffer,
  bucket: string,
  contentType: string,
  customFilename?: string
): Promise<UploadResult> {
  // Use R2 if configured
  if (isR2Configured()) {
    const filename = customFilename || generateR2Key(bucket, file instanceof File ? file.name : `file-${Date.now()}`);
    const r2Key = `${bucket}/${filename}`;
    const url = await uploadToR2(file, r2Key, contentType);
    return { url, path: r2Key, provider: "r2" };
  }

  // Fallback: Supabase Storage
  const supabase = createServiceClient();
  const ext = contentType.split("/")[1] || "bin";
  const filePath = customFilename
    ? `${customFilename}.${ext}`
    : `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const body = file instanceof File ? Buffer.from(await file.arrayBuffer()) : file;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, body, {
      contentType,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Supabase Storage upload failed: ${uploadError.message}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(filePath);

  return { url: publicUrl, path: filePath, provider: "supabase" };
}

/**
 * Upload with upsert (replaces existing file with same name).
 * Used for QRIS images where we want to overwrite.
 */
export async function uploadFileUpsert(
  file: File | Buffer,
  bucket: string,
  filename: string,
  contentType: string
): Promise<UploadResult> {
  // Use R2 if configured (R2 PutObject always overwrites by default)
  if (isR2Configured()) {
    const r2Key = `${bucket}/${filename}`;
    const url = await uploadToR2(file, r2Key, contentType);
    return { url, path: r2Key, provider: "r2" };
  }

  // Fallback: Supabase Storage with upsert
  const supabase = createServiceClient();
  const body = file instanceof File ? Buffer.from(await file.arrayBuffer()) : file;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filename, body, {
      contentType,
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Supabase Storage upsert failed: ${uploadError.message}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(filename);

  return { url: publicUrl, path: filename, provider: "supabase" };
}