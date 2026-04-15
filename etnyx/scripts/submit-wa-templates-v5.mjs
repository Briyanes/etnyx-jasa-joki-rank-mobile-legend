#!/usr/bin/env node
/**
 * Submit 5 v5 WA templates to Meta Business Suite via Graph API.
 * 
 * v5 changes vs v4:
 * - NO header image (removed — cleaner look, faster load)
 * - "Hubungi CS ETNYX" button now uses /cs?order={{1}} (dynamic URL with Order ID)
 *   so customer gets pre-filled WA message with their Order ID
 * - Templates 1-4: 5 body params (same as v4)
 *   {{1}} = Order ID
 *   {{2}} = Paket type (Joki Paket / Joki Per Bintang / Joki Gendong)
 *   {{3}} = Detail (rank info / package_title)
 *   {{4}} = Addons (Standard / Express / Premium / Express + Premium)
 *   {{5}} = Total (formatted rupiah)
 * - Template 5 (cancelled): 2 body params (same as v4)
 * 
 * Usage: cd etnyx && node scripts/submit-wa-templates-v5.mjs
 */

import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

// ── Read .env.local ──
function loadEnv() {
  try {
    const content = readFileSync(".env.local", "utf-8");
    const env = {};
    for (const line of content.split("\n")) {
      const m = line.match(/^([^#=\s]+)\s*=\s*(.*)$/);
      if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
    return env;
  } catch {
    console.error("❌ .env.local not found. Run from the etnyx/ directory.");
    process.exit(1);
  }
}

const env = loadEnv();
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const SITE_URL = env.NEXT_PUBLIC_SITE_URL || "https://etnyx.com";

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local");
  process.exit(1);
}

// ── Get Meta settings from DB ──
async function getMetaSettings() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const { data, error } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "integrations")
    .single();

  if (error || !data) {
    console.error("❌ Cannot read integration settings:", error?.message);
    process.exit(1);
  }

  const v = data.value || {};
  return {
    accessToken: v.metaWaAccessToken,
    wabaId: v.metaWaBusinessAccountId || "1629247748196420",
  };
}

// ── Template definitions (NO header image in v5) ──
function buildTemplates() {
  const LINE = "─────────────────";
  const FOOTER = "Powered by ETNYX.COM";
  const DISCLAIMER = `*[ Pesan otomatis ]*\n💬 Balas "menu" untuk bantuan otomatis`;

  // Example body_text for templates 1-4 (5 params)
  const exampleBody5 = [["ETX-ABC123", "Joki Paket", "Epic III → Legend I", "Express + Premium", "Rp 58.500"]];

  return [
    // 1. ORDER DIKONFIRMASI
    {
      name: "order_confirmation_v5",
      category: "UTILITY",
      language: "id",
      components: [
        {
          type: "BODY",
          text: `*ORDER DIKONFIRMASI*\n\n${LINE}\nDetail Order:\n• Order ID: *{{1}}*\n• Paket: *{{2}}*\n• Detail: *{{3}}*\n• Addons: *{{4}}*\n• Total: *{{5}}*\n${LINE}\nSTATUS : *Menunggu Pembayaran*\n${LINE}\n\nSilakan selesaikan pembayaran untuk memproses order kamu.\n\n${DISCLAIMER}`,
          example: { body_text: exampleBody5 },
        },
        { type: "FOOTER", text: FOOTER },
        {
          type: "BUTTONS",
          buttons: [
            {
              type: "URL",
              text: "Upload Bukti TF Disini",
              url: `${SITE_URL}/payment/manual/?order_id={{1}}`,
              example: ["ETX-ABC123"],
            },
            {
              type: "URL",
              text: "Hubungi CS ETNYX",
              url: `${SITE_URL}/cs?order={{1}}`,
              example: ["ETX-ABC123"],
            },
          ],
        },
      ],
    },

    // 2. PEMBAYARAN DIKONFIRMASI
    {
      name: "payment_confirmed_v5",
      category: "UTILITY",
      language: "id",
      components: [
        {
          type: "BODY",
          text: `*PEMBAYARAN DIKONFIRMASI*\n\n${LINE}\nDetail Order:\n• Order ID: *{{1}}*\n• Paket: *{{2}}*\n• Detail: *{{3}}*\n• Addons: *{{4}}*\n• Total: *{{5}}*\n${LINE}\nSTATUS : *Pembayaran Diterima* ✅\n${LINE}\n\nOrder kamu akan segera diproses oleh tim booster kami.\nKamu akan menerima notifikasi saat pengerjaan dimulai.\n\nTerima kasih sudah mempercayai *ETNYX*!\n\n${DISCLAIMER}`,
          example: { body_text: exampleBody5 },
        },
        { type: "FOOTER", text: FOOTER },
        {
          type: "BUTTONS",
          buttons: [
            {
              type: "URL",
              text: "Track progress order",
              url: `${SITE_URL}/track/?id={{1}}`,
              example: ["ETX-ABC123"],
            },
            {
              type: "URL",
              text: "Hubungi CS ETNYX",
              url: `${SITE_URL}/cs?order={{1}}`,
              example: ["ETX-ABC123"],
            },
          ],
        },
      ],
    },

    // 3. ORDER SEDANG DIKERJAKAN
    {
      name: "order_started_v5",
      category: "UTILITY",
      language: "id",
      components: [
        {
          type: "BODY",
          text: `*ORDER SEDANG DIKERJAKAN*\n\n${LINE}\nDetail Order:\n• Order ID: *{{1}}*\n• Paket: *{{2}}*\n• Detail: *{{3}}*\n• Addons: *{{4}}*\n• Total: *{{5}}*\n${LINE}\nSTATUS : *Sedang Dikerjakan* 🔄\n${LINE}\n\nOrder kamu sedang dalam pengerjaan oleh booster kami.\n\n⚠️ *Mohon jangan login* selama proses joki dikerjakan ya.\n\n${DISCLAIMER}`,
          example: { body_text: exampleBody5 },
        },
        { type: "FOOTER", text: FOOTER },
        {
          type: "BUTTONS",
          buttons: [
            {
              type: "URL",
              text: "Track progress order",
              url: `${SITE_URL}/track/?id={{1}}`,
              example: ["ETX-ABC123"],
            },
            {
              type: "URL",
              text: "Hubungi CS ETNYX",
              url: `${SITE_URL}/cs?order={{1}}`,
              example: ["ETX-ABC123"],
            },
          ],
        },
      ],
    },

    // 4. ORDER SELESAI
    {
      name: "completed_order_v5",
      category: "UTILITY",
      language: "id",
      components: [
        {
          type: "BODY",
          text: `*ORDER SELESAI*\n\n${LINE}\nDetail Order:\n• Order ID: *{{1}}*\n• Paket: *{{2}}*\n• Detail: *{{3}}*\n• Addons: *{{4}}*\n• Total: *{{5}}*\n${LINE}\nSTATUS : *Selesai* 🏆\n${LINE}\n\nYeay! Order kamu sudah selesai dikerjakan.\n\nSilakan cek akun kamu dan *GANTI PASSWORD* untuk keamanan.\n\n⭐ Bantu kami dengan review yuk!\n\n${DISCLAIMER}`,
          example: { body_text: exampleBody5 },
        },
        { type: "FOOTER", text: FOOTER },
        {
          type: "BUTTONS",
          buttons: [
            {
              type: "URL",
              text: "Tulis Review Disini",
              url: `${SITE_URL}/review/?id={{1}}`,
              example: ["ETX-ABC123"],
            },
            {
              type: "URL",
              text: "Hubungi CS ETNYX",
              url: `${SITE_URL}/cs?order={{1}}`,
              example: ["ETX-ABC123"],
            },
          ],
        },
      ],
    },

    // 5. ORDER DIBATALKAN (2 body params, 1 button)
    {
      name: "order_cancelled_v5",
      category: "UTILITY",
      language: "id",
      components: [
        {
          type: "BODY",
          text: `*ORDER DIBATALKAN*\n\n${LINE}\nDetail Order:\n• Order ID: *{{1}}*\n• Username: *{{2}}*\n${LINE}\nSTATUS : *Dibatalkan* ❌\n${LINE}\n\nHalo, order kamu telah dibatalkan.\n\nJika ini adalah kesalahan atau ingin order ulang, hubungi CS kami via tombol di bawah.\n\n${DISCLAIMER}`,
          example: {
            body_text: [["ETX-ABC123", "GamerPro123"]],
          },
        },
        { type: "FOOTER", text: FOOTER },
        {
          type: "BUTTONS",
          buttons: [
            {
              type: "URL",
              text: "Hubungi CS ETNYX",
              url: `${SITE_URL}/cs?order={{1}}`,
              example: ["ETX-ABC123"],
            },
          ],
        },
      ],
    },
  ];
}

// ── Main ──
async function main() {
  console.log("🔄 Reading Meta WA settings...");
  const { accessToken, wabaId } = await getMetaSettings();

  if (!accessToken) {
    console.error("❌ No Meta WA access token");
    process.exit(1);
  }

  console.log(`✅ WABA ID: ${wabaId}`);
  console.log(`📌 v5: No header image, CS button uses /cs?order={{1}}\n`);

  const templates = buildTemplates();

  for (const tpl of templates) {
    console.log(`📤 Submitting: ${tpl.name}...`);
    try {
      const res = await fetch(
        `https://graph.facebook.com/v21.0/${wabaId}/message_templates`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(tpl),
        }
      );
      const data = await res.json();
      if (res.ok) {
        console.log(`   ✅ SUBMITTED → ID: ${data.id}, Status: ${data.status}`);
      } else {
        console.log(`   ❌ FAILED →`, JSON.stringify(data.error || data, null, 2));
      }
    } catch (err) {
      console.log(`   ❌ ERROR →`, err.message);
    }
    console.log("");
  }

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Done! Cek Meta Business Suite untuk status approval.");
  console.log("Kode notifications.ts sudah siap pakai v5.");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

main().catch(console.error);
