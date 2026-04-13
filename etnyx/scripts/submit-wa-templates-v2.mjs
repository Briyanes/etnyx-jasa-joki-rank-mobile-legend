#!/usr/bin/env node
/**
 * Submit 5 new WA templates (v2) to Meta Business Suite via Graph API.
 * 
 * Usage:
 *   node scripts/submit-wa-templates-v2.mjs
 * 
 * Reads SUPABASE_URL, SUPABASE_KEY from .env.local, then fetches
 * Meta WA access token + WABA ID from the settings table.
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
const WA_CS = "6281515141540";
const HEADER_IMAGE_URL = `${SITE_URL}/header-wa.jpg`;

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

// ── Template definitions ──
function buildTemplates(headerHandle) {
  const LINE = "─────────────────";
  const FOOTER_TEXT = "etnyx.com";
  const DISCLAIMER = `[ Pesan otomatis ]\n💬 Balas "menu" untuk bantuan otomatis`;

  const headerComponent = {
    type: "HEADER",
    format: "IMAGE",
    example: { header_handle: [headerHandle] },
  };

  return [
    {
      name: "order_confirmation_v2",
      category: "UTILITY",
      language: "id",
      components: [
        headerComponent,
        {
          type: "BODY",
          text: `${LINE}\n   *Order Dikonfirmasi* 📋\n${LINE}\n\n👋 Halo! Terima kasih sudah order di ETNYX!\n\n*Detail Order:*\n• Order ID: *{{1}}*\n• Rank Tujuan: *{{2}}*\n• Paket: *{{3}}*\n• Total: *{{4}}*\n\n*Status:* Menunggu Pembayaran\n\nSilakan selesaikan pembayaran untuk memproses order kamu.\n\n${DISCLAIMER}`,
          example: {
            body_text: [["ETX-ABC123", "Mythic", "Express + Premium", "Rp 58.500"]],
          },
        },
        { type: "FOOTER", text: FOOTER_TEXT },
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
              url: `${SITE_URL}/bio`,
            },
          ],
        },
      ],
    },

    {
      name: "payment_confirmed_v2",
      category: "UTILITY",
      language: "id",
      components: [
        headerComponent,
        {
          type: "BODY",
          text: `${LINE}\n   *Pembayaran Dikonfirmasi* ✅\n${LINE}\n\nHalo! Pembayaran kamu sudah kami terima dan dikonfirmasi.\n\n*Detail Order:*\n• Order ID: *{{1}}*\n• Rank Tujuan: *{{2}}*\n• Paket: *{{3}}*\n• Total: *{{4}}*\n\nOrder kamu akan segera diproses oleh tim booster kami.\n\nTerima kasih sudah mempercayai *ETNYX*!\n\n${DISCLAIMER}`,
          example: {
            body_text: [["ETX-ABC123", "Mythic", "Express + Premium", "Rp 58.500"]],
          },
        },
        { type: "FOOTER", text: FOOTER_TEXT },
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
              url: `${SITE_URL}/bio`,
            },
          ],
        },
      ],
    },

    {
      name: "order_started_v2",
      category: "UTILITY",
      language: "id",
      components: [
        headerComponent,
        {
          type: "BODY",
          text: `${LINE}\n   *Order Sedang Dikerjakan* 🔄\n${LINE}\n\nHalo! Order kamu sudah dikonfirmasi dan sedang dalam pengerjaan oleh booster kami.\n\n*Detail Order:*\n• Order ID: *{{1}}*\n• Rank Tujuan: *{{2}}*\n• Paket: *{{3}}*\n• Total: *{{4}}*\n\n⚠️ *Mohon jangan login* selama proses joki dikerjakan ya.\n\n${DISCLAIMER}`,
          example: {
            body_text: [["ETX-ABC123", "Mythic", "Express + Premium", "Rp 58.500"]],
          },
        },
        { type: "FOOTER", text: FOOTER_TEXT },
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
              url: `${SITE_URL}/bio`,
            },
          ],
        },
      ],
    },

    {
      name: "completed_order_v2",
      category: "UTILITY",
      language: "id",
      components: [
        headerComponent,
        {
          type: "BODY",
          text: `${LINE}\n   *Order Selesai* 🏆\n${LINE}\n\nYeay! Order kamu sudah selesai dikerjakan.\n\n*Detail Order:*\n• Order ID: *{{1}}*\n• Rank Tujuan: *{{2}}*\n• Paket: *{{3}}*\n• Total: *{{4}}*\n\nTerima kasih sudah menggunakan *ETNYX*!\n\nSilakan cek akun kamu dan *ganti password* untuk keamanan.\n\n⭐ *Bantu kami dengan review yuk!*\n\n${DISCLAIMER}`,
          example: {
            body_text: [["ETX-ABC123", "Mythic", "Express + Premium", "Rp 58.500"]],
          },
        },
        { type: "FOOTER", text: FOOTER_TEXT },
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
              url: `${SITE_URL}/bio`,
            },
          ],
        },
      ],
    },

    {
      name: "order_cancelled_v2",
      category: "UTILITY",
      language: "id",
      components: [
        headerComponent,
        {
          type: "BODY",
          text: `${LINE}\n   *Order Dibatalkan* ❌\n${LINE}\n\nHalo, order kamu telah dibatalkan.\n\n*Order ID:* {{1}}\n*Username:* {{2}}\n\nJika ini adalah kesalahan atau ingin order ulang, hubungi CS kami via tombol di bawah.\n\n${DISCLAIMER}`,
          example: {
            body_text: [["ETX-ABC123", "GamerPro123"]],
          },
        },
        { type: "FOOTER", text: FOOTER_TEXT },
        {
          type: "BUTTONS",
          buttons: [
            {
              type: "URL",
              text: "Hubungi CS ETNYX",
              url: `${SITE_URL}/bio`,
            },
          ],
        },
      ],
    },
  ];
}

// ── Submit templates to Meta ──
async function main() {
  console.log("🔄 Reading Meta WA settings from database...");
  const { accessToken, wabaId } = await getMetaSettings();

  if (!accessToken) {
    console.error("❌ No Meta WA access token found in settings");
    process.exit(1);
  }

  console.log(`✅ WABA ID: ${wabaId}`);
  console.log(`✅ Access Token: ${accessToken.slice(0, 15)}...`);
  console.log("");

  // Step 1: Get App ID from token
  console.log("🔄 Getting App ID from access token...");
  const debugRes = await fetch(
    `https://graph.facebook.com/debug_token?input_token=${accessToken}&access_token=${accessToken}`
  );
  const debugData = await debugRes.json();
  const appId = debugData?.data?.app_id;
  if (!appId) {
    console.error("❌ Cannot determine App ID from token:", JSON.stringify(debugData));
    process.exit(1);
  }
  console.log(`✅ App ID: ${appId}`);

  // Step 2: Download header image
  console.log(`🔄 Downloading header image from ${HEADER_IMAGE_URL}...`);
  const imgRes = await fetch(HEADER_IMAGE_URL);
  if (!imgRes.ok) {
    console.error(`❌ Cannot download image: ${imgRes.status}`);
    process.exit(1);
  }
  const imgBuffer = Buffer.from(await imgRes.arrayBuffer());
  const imgType = imgRes.headers.get("content-type") || "image/jpeg";
  console.log(`✅ Image downloaded: ${imgBuffer.length} bytes (${imgType})`);

  // Step 3: Upload image to Meta via Resumable Upload API
  console.log("🔄 Creating upload session...");
  const uploadSessionRes = await fetch(
    `https://graph.facebook.com/v21.0/${appId}/uploads?file_length=${imgBuffer.length}&file_type=${encodeURIComponent(imgType)}&access_token=${accessToken}`,
    { method: "POST" }
  );
  const uploadSession = await uploadSessionRes.json();
  if (!uploadSession.id) {
    console.error("❌ Upload session failed:", JSON.stringify(uploadSession));
    process.exit(1);
  }
  console.log(`✅ Upload session: ${uploadSession.id}`);

  console.log("🔄 Uploading image data...");
  const uploadRes = await fetch(
    `https://graph.facebook.com/v21.0/${uploadSession.id}`,
    {
      method: "POST",
      headers: {
        Authorization: `OAuth ${accessToken}`,
        file_offset: "0",
        "Content-Type": imgType,
      },
      body: imgBuffer,
    }
  );
  const uploadData = await uploadRes.json();
  const headerHandle = uploadData.h;
  if (!headerHandle) {
    console.error("❌ Image upload failed:", JSON.stringify(uploadData));
    process.exit(1);
  }
  console.log(`✅ Header handle: ${headerHandle.slice(0, 30)}...`);
  console.log("");

  // Step 4: Submit templates
  const templates = buildTemplates(headerHandle);

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
  console.log("Done! Check Meta Business Suite for approval status.");
  console.log("Templates biasanya di-review dalam 1-24 jam.");
  console.log("Setelah APPROVED, update kode di notifications.ts ke v2.");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

main().catch(console.error);
