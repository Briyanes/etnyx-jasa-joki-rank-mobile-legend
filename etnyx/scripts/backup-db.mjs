/**
 * Manual DB backup — exports essential tables to a timestamped JSON file.
 *
 * WHY: Supabase free tier has no automatic backups/PITR. Until Supabase Pro
 * (with PITR) is enabled, run this regularly (e.g. weekly + before risky
 * changes) and copy files off-machine (Drive/Time Machine).
 *
 * Usage:
 *   node --env-file=.env.local scripts/backup-db.mjs
 *   node --env-file=.env.local scripts/backup-db.mjs --tables=orders,customers
 *
 * Output: backups/backup-<timestamp>.json (gitignored)
 * Restore: data is plain JSON per table — re-insert via Supabase dashboard
 * or a script; column names match the DB schema.
 */
import { createClient } from "@supabase/supabase-js";
import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const PAGE = 1000;
const DEFAULT_TABLES = [
  "orders", "customers", "settings", "promo_codes", "promo_usage",
  "referrals", "reviews", "payment_callbacks", "payment_proofs",
  "order_logs", "testimonials", "boosters", "chat_messages",
  "portfolio", "push_subscriptions",
];

const tablesArg = process.argv.find((a) => a.startsWith("--tables="));
const tables = tablesArg ? tablesArg.split("=")[1].split(",") : DEFAULT_TABLES;

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in env");
  process.exit(1);
}
const supabase = createClient(url, key, { auth: { persistSession: false } });

const outDir = join(dirname(fileURLToPath(import.meta.url)), "..", "backups");
mkdirSync(outDir, { recursive: true });

const backup = { exportedAt: new Date().toISOString(), tables: {} };
let totalRows = 0;

for (const table of tables) {
  const rows = [];
  let from = 0;
  for (;;) {
    const { data, error } = await supabase.from(table).select("*").range(from, from + PAGE - 1);
    if (error) {
      console.warn(`⚠️  skip "${table}": ${error.message}`);
      backup.tables[table] = { skipped: true, reason: error.message };
      break;
    }
    rows.push(...data);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  if (!backup.tables[table]?.skipped) {
    backup.tables[table] = { count: rows.length, rows };
    totalRows += rows.length;
    console.log(`✓ ${table}: ${rows.length} rows`);
  }
}

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const file = join(outDir, `backup-${stamp}.json`);
writeFileSync(file, JSON.stringify(backup));
console.log(`\n📦 Backup complete: ${file} (${totalRows} rows total)`);
