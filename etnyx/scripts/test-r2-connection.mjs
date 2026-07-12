#!/usr/bin/env node
/**
 * Quick R2 Connection Diagnostic
 * Tests upload, download, and list operations with detailed error output.
 */
import { S3Client, PutObjectCommand, ListObjectsV2Command, HeadBucketCommand } from "@aws-sdk/client-s3";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

// Load .env.local
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, "..", ".env.local");
const envContent = readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
  if (!process.env[key]) process.env[key] = val;
}

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "etnyx";
const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;

console.log("=".repeat(60));
console.log("  R2 Connection Diagnostic");
console.log("=".repeat(60));
console.log(`  Account ID:        ${R2_ACCOUNT_ID?.slice(0, 8)}...`);
console.log(`  Access Key ID:     ${R2_ACCESS_KEY_ID?.slice(0, 8)}...`);
console.log(`  Secret Key:        ${R2_SECRET_ACCESS_KEY?.slice(0, 4)}****`);
console.log(`  Bucket Name:       ${R2_BUCKET_NAME}`);
console.log(`  Public URL:        ${R2_PUBLIC_URL}`);
console.log(`  Endpoint:          https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`);
console.log("=".repeat(60) + "\n");

const client = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

// Test 1: HeadBucket (check if bucket exists and is accessible)
console.log("Test 1: HeadBucket (bucket access)...");
try {
  await client.send(new HeadBucketCommand({ Bucket: R2_BUCKET_NAME }));
  console.log("  ✅ PASS — Bucket is accessible\n");
} catch (e) {
  console.log(`  ❌ FAIL — ${e.name}: ${e.message}`);
  if (e.$metadata) console.log(`     HTTP Status: ${e.$metadata.httpStatusCode}`);
  console.log();
}

// Test 2: ListObjects (check read permission)
console.log("Test 2: ListObjects (read permission)...");
try {
  const result = await client.send(new ListObjectsV2Command({ Bucket: R2_BUCKET_NAME, MaxKeys: 5 }));
  console.log(`  ✅ PASS — Found ${result.Contents?.length || 0} objects\n`);
} catch (e) {
  console.log(`  ❌ FAIL — ${e.name}: ${e.message}`);
  if (e.$metadata) console.log(`     HTTP Status: ${e.$metadata.httpStatusCode}`);
  console.log();
}

// Test 3: PutObject (check write permission)
console.log("Test 3: PutObject (write permission)...");
try {
  await client.send(new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: "_diagnostic-test.txt",
    Body: Buffer.from("R2 migration diagnostic test - safe to delete"),
    ContentType: "text/plain",
  }));
  console.log("  ✅ PASS — Write successful\n");
} catch (e) {
  console.log(`  ❌ FAIL — ${e.name}: ${e.message}`);
  if (e.$metadata) console.log(`     HTTP Status: ${e.$metadata.httpStatusCode}`);
  if (e.Code) console.log(`     Error Code: ${e.Code}`);
  console.log();
}

console.log("=".repeat(60));
console.log("  If Test 3 failed with Access Denied:");
console.log("  → Your R2 API token needs 'Object Read & Write' permission");
console.log("  → Go to Cloudflare Dashboard → R2 → Manage R2 API Tokens");
console.log("  → Create new token with 'Object Read & Write' permission");
console.log("=".repeat(60) + "\n");