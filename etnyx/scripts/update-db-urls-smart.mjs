#!/usr/bin/env node
/**
 * Smart DB URL Updater: Auto-discovers all tables/columns with Supabase Storage URLs.
 * Queries information_schema to find all text columns, then scans for storage URLs.
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

// Use raw SQL via rpc to get all text columns
const SQL_QUERY = `
SELECT table_name, column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND data_type IN ('text', 'character varying', 'character')
ORDER BY table_name, column_name;
`;

console.log("=".repeat(60));
console.log("  Smart DB URL Updater: Auto-discover & update");
console.log("=".repeat(60));
console.log(`  R2 Public URL: ${R2_PUBLIC_URL}\n`);

// Execute raw SQL via supabase rpc
const { data: columns, error: sqlError } = await supabase.rpc('exec_sql', { sql: SQL_QUERY }).maybeSingle();

if (sqlError || !columns) {
  // Fallback: try querying each known table manually
  console.log("  Raw SQL not available, trying known tables...\n");
  
  // First, let's discover tables by trying common ones
  const knownTables = [
    'orders', 'payments', 'payment_proofs', 'proofs', 'submissions',
    'worker_submissions', 'staff_submissions', 'boosters', 'workers',
    'portfolio', 'galleries', 'testimonials', 'reviews', 'ads',
    'settings', 'booster_profiles', 'profiles', 'screenshots'
  ];
  
  let totalUpdated = 0;
  
  for (const table of knownTables) {
    try {
      // Try to get all columns by selecting *
      const { data, error } = await supabase.from(table).select('*').limit(100);
      if (error) continue;
      if (!data || data.length === 0) continue;
      
      // Find columns that contain storage URLs
      const columns = Object.keys(data[0]);
      let tableUpdated = 0;
      
      for (const col of columns) {
        for (const row of data) {
          const val = row[col];
          if (val && typeof val === 'string' && val.includes('/storage/v1/object/public/')) {
            const match = val.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
            if (match) {
              const newUrl = `${R2_PUBLIC_URL}/${match[1]}/${match[2]}`;
              const { error: updateError } = await supabase
                .from(table)
                .update({ [col]: newUrl })
                .eq('id', row.id);
              if (!updateError) {
                tableUpdated++;
                console.log(`  [OK] ${table}.${col}: ${val.substring(0, 60)}... -> R2`);
              }
            }
          }
        }
      }
      
      if (tableUpdated > 0) {
        console.log(`  -> ${table}: ${tableUpdated} rows updated\n`);
        totalUpdated += tableUpdated;
      }
    } catch (e) {
      // skip
    }
  }
  
  console.log(`\n  Total rows updated: ${totalUpdated}`);
  
  if (totalUpdated === 0) {
    console.log("\n  No Supabase Storage URLs found in database.");
    console.log("  This could mean:");
    console.log("    1. URLs are stored in a different format");
    console.log("    2. Tables have different names");
    console.log("    3. Data hasn't been inserted yet");
    console.log("\n  Let's check orders table specifically...");
    
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, payment_proof_url, payment_proof')
      .limit(5);
    
    if (!ordersError && orders) {
      console.log("\n  Sample orders data:");
      for (const o of orders) {
        console.log(`    Order ${o.id}: proof_url=${o.payment_proof_url || 'null'}, proof=${o.payment_proof || 'null'}`);
      }
    }
  }
} else {
  // We have column info - scan each one
  console.log(`  Found ${columns.length} text columns to scan\n`);
  
  let totalUpdated = 0;
  
  // Group by table
  const byTable = {};
  for (const { table_name, column_name } of columns) {
    if (!byTable[table_name]) byTable[table_name] = [];
    byTable[table_name].push(column_name);
  }
  
  for (const [table, cols] of Object.entries(byTable)) {
    for (const col of cols) {
      try {
        // Use ilike to find rows with supabase storage URLs
        const { data, error } = await supabase
          .from(table)
          .select(`id, ${col}`)
          .ilike(col, '%/storage/v1/object/public/%')
          .limit(500);
        
        if (error || !data || data.length === 0) continue;
        
        let colUpdated = 0;
        for (const row of data) {
          const val = row[col];
          const match = val?.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
          if (match) {
            const newUrl = `${R2_PUBLIC_URL}/${match[1]}/${match[2]}`;
            const { error: updateError } = await supabase
              .from(table)
              .update({ [col]: newUrl })
              .eq('id', row.id);
            if (!updateError) colUpdated++;
          }
        }
        
        if (colUpdated > 0) {
          console.log(`  [OK] ${table}.${col}: ${colUpdated} rows updated`);
          totalUpdated += colUpdated;
        }
      } catch (e) {
        // skip
      }
    }
  }
  
  console.log(`\n  Total rows updated: ${totalUpdated}`);
}

console.log("\n" + "=".repeat(60) + "\n");