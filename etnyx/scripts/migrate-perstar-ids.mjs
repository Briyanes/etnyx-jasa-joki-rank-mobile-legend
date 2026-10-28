/**
 * One-off data migration: normalize `perstar_pricing` tier ids in the
 * `settings` table so price lookups (key "mythicromawi") actually match.
 *
 * Background: the Mythic per-star entry was seeded with the GENDONG-style id
 * "mythic" (gendong's canonical id) instead of the per-star canonical id
 * "mythicromawi". Every price lookup missed it and silently fell back to the
 * hardcoded default (Rp 19.000) — so admin price changes never appeared.
 *
 * This script:
 *   1. Renames alias ids → canonical ids (mythicroomawi/mythic → mythicromawi)
 *   2. Fixes the tier name to "Mythic Romawi"
 *   3. Adds the missing "master" tier (default Rp 5.000) so admins can control it
 *   4. Writes a timestamped backup of the old value next to this script
 *
 * Usage:
 *   node --env-file=.env.local scripts/migrate-perstar-ids.mjs --dry-run
 *   node --env-file=.env.local scripts/migrate-perstar-ids.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const DRY_RUN = process.argv.includes("--dry-run");
const ALIASES = { mythicroomawi: "mythicromawi", mythic: "mythicromawi" };
const CANONICAL_NAMES = { mythicromawi: "Mythic Romawi" };

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in env");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

// 1. Read current value
const { data, error } = await supabase
  .from("settings")
  .select("key, value")
  .eq("key", "perstar_pricing")
  .single();
if (error) {
  console.error("❌ Fetch failed:", error.message);
  process.exit(1);
}

const rows = data.value;
console.log("=== BEFORE ===");
console.log(JSON.stringify(rows, null, 2));

// 2. Transform: rename alias ids → canonical, dedupe (last wins), fix names
const map = new Map();
for (const r of rows) {
  const id = ALIASES[r.id] || r.id;
  if (ALIASES[r.id]) console.log(`→ rename id "${r.id}" → "${id}"`);
  map.set(id, {
    ...r,
    id,
    ...(CANONICAL_NAMES[id] ? { name: CANONICAL_NAMES[id] } : {}),
  });
}

// 3. Ensure the "master" tier exists (default Rp 5.000)
if (![...map.keys()].includes("master")) {
  console.log("→ add missing tier \"master\" (default Rp 5.000)");
  map.set("master", {
    id: "master",
    name: "Master",
    price: 5000,
    icon: "/icons-tier/Master.webp",
    maxStars: 25,
  });
}

const next = [...map.values()];
console.log("=== AFTER ===");
console.log(JSON.stringify(next, null, 2));

if (DRY_RUN) {
  console.log("DRY RUN — nothing saved.");
  process.exit(0);
}

// 4. Backup old value, then upsert
const backupPath = join(dirname(fileURLToPath(import.meta.url)), `perstar-backup-${Date.now()}.json`);
writeFileSync(backupPath, JSON.stringify(rows, null, 2));
console.log(`📦 Backup saved: ${backupPath}`);

const { error: upErr } = await supabase
  .from("settings")
  .upsert(
    { key: "perstar_pricing", value: next, updated_at: new Date().toISOString() },
    { onConflict: "key" }
  );
if (upErr) {
  console.error("❌ Upsert failed:", upErr.message);
  process.exit(1);
}

// 5. Verify
const { data: check } = await supabase
  .from("settings")
  .select("value")
  .eq("key", "perstar_pricing")
  .single();
const badIds = (check.value || []).filter((r) => ALIASES[r.id]);
if (badIds.length === 0) {
  console.log("✅ Migration verified — all perstar_pricing ids are canonical.");
} else {
  console.error("⚠️ Verification mismatch:", JSON.stringify(badIds));
  process.exit(1);
}
