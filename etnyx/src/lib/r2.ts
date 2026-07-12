import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

/**
 * Cloudflare R2 Storage Client
 * 
 * S3-compatible API for zero egress fees.
 * Setup: Create R2 bucket in Cloudflare Dashboard, generate API tokens.
 * 
 * Required env vars:
 * - R2_ACCOUNT_ID
 * - R2_ACCESS_KEY_ID
 * - R2_SECRET_ACCESS_KEY
 * - R2_BUCKET_NAME
 * - NEXT_PUBLIC_R2_PUBLIC_URL (e.g. https://pub-xxxx.r2.dev or custom domain)
 */

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "etnyx-storage";
const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;

let r2Client: S3Client | null = null;

function getR2Client(): S3Client {
  if (r2Client) return r2Client;
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    throw new Error("R2 env vars not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY");
  }
  r2Client = new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });
  return r2Client;
}

export function isR2Configured(): boolean {
  return !!(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY);
}

export async function uploadToR2(
  file: File | Buffer,
  key: string,
  contentType: string
): Promise<string> {
  const client = getR2Client();
  const body = file instanceof File ? Buffer.from(await file.arrayBuffer()) : file;

  await client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );

  // Use proxy route if public URL not set, otherwise use public URL
  return getR2PublicUrl(key);
}

export async function deleteFromR2(key: string): Promise<void> {
  const client = getR2Client();
  await client.send(
    new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    })
  );
}

export async function getSignedR2Url(key: string, expiresIn = 3600): Promise<string> {
  const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
  const client = getR2Client();
  const command = new GetObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key });
  return getSignedUrl(client, command, { expiresIn });
}

export function generateR2Key(folder: string, filename: string): string {
  const ext = filename.split(".").pop() || "";
  const safeName = filename.replace(/[^a-zA-Z0-9.-]/g, "_").toLowerCase();
  const timestamp = Date.now();
  return `${folder}/${timestamp}-${safeName}`;
}

/**
 * Get the public URL for an R2 object.
 * Uses /api/storage/ proxy by default for reliability (works without enabling R2 public access).
 * Set NEXT_PUBLIC_R2_PUBLIC_URL to use direct CDN access (e.g. custom domain or enabled r2.dev).
 */
export function getR2PublicUrl(key: string): string {
  // If a custom domain or verified r2.dev URL is set, use it directly
  const publicUrl = R2_PUBLIC_URL;
  if (publicUrl && !publicUrl.includes("r2.dev")) {
    return `${publicUrl}/${key}`;
  }
  // Default: proxy through Next.js API (works without R2 public access enabled)
  return `/api/storage/${key}`;
}
