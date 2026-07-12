#!/usr/bin/env node
/**
 * Update Database URLs: Supabase Storage → R2
 * Scans all tables for Supabase Storage URLs and replaces with R2 URLs.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});

const URL_COLUMNS = [
  { table: "portfolio", column: "image_url" },
  { table: "payment_proofs", column: "file_url" },
  { table: "orders", column: "payment_proof_url" },
  { table: "staff_submissions", column: "screenshot_url" },
  { table: "booster_profiles", column: "avatar_url" },
  { table: "testimonials", column: "avatar_url" },
  { table: "ads", column: "image_url" },
  { table: "reviews", column: "avatar_url" },
];

function isSupabaseStorageUrl(url) {
  return url && typeof url === "string" && url.includes("/storage/v1/object/public/");
}

function extractBucketAndPath(url) {
  const match = url.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
  if (!match) return null;
  return { bucket: match[1], path: match[2] };
}

function buildR2Url(bucket, path) {
  return `${R2_PUBLIC_URL}/${bucket}/${path}`;
}

console.log("=".repeat(60));
console.log("  Database URL Update: Supabase -> R2");
console.log("=".repeat(60));
console.log(`  R2 Public URL: ${R2_PUBLIC_URL}\n`);

let totalUpdated = 0;

for (const { table, column } of URL_COLUMNS) {
  try {
    const { data, error } = await supabase
      .from(table)
      .select(`id, ${column}`)
      .not(column, "is", null)
      .limit(1000);

    if (error) {
      console.log(`  [SKIP] ${table}.${column}: ${error.message}`);
      continue;
    }

    if (!data || data.length === 0) {
      console.log(`  [ ] ${table}.${column}: no rows`);
      continue;
    }

    let tableUpdated = 0;
    for (const row of data) {
      const url = row[column];
      if (isSupabaseStorageUrl(url)) {
        const extracted = extractBucketAndPath(url);
        if (extracted) {
          const newUrl = buildR2Url(extracted.bucket, extracted.path);
          const { error: updateError } = await supabase
            .from(table)
            .update({ [column]: newUrl })
            .eq("id", row.id);
          if (!updateError) tableUpdated++;
        }
      }
    }

    console.log(`  [OK] ${table}.${column}: ${tableUpdated} rows updated`);
    totalUpdated += tableUpdated;
  } catch (e) {
    console.log(`  [!] ${table}.${column}: ${e.message}`);
  }
}

console.log(`\n  Total rows updated: ${totalUpdated}`);
console.log("=".repeat(60) + "\n");