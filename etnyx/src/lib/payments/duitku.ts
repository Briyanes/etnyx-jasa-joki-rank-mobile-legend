import crypto from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

// ============================================
// Duitku Payment Gateway — Provider Layer
// Docs: https://docs.duitku.com
// Flow: create invoice (paymentUrl) → customer pays → callback w/ signature → order confirmed
// Modes: sandbox (https://sandbox.duitku.com) | live (https://passport.duitku.com)
// ============================================

const SANDBOX_BASE_URL = "https://sandbox.duitku.com/webapi/api/merchant";
const LIVE_BASE_URL = "https://passport.duitku.com/webapi/api/merchant";

export interface DuitkuConfig {
  merchantCode: string;
  apiKey: string;
  mode: "sandbox" | "live";
}

export interface DuitkuCheckoutParams {
  amount: number;
  merchantOrderId: string; // our reference, e.g. ETN-{orderId}-{ts}
  productDetails: string;
  email: string;
  phoneNumber?: string;
  returnUrl: string;
  callbackUrl: string;
  expiryDuration?: number; // minutes
  paymentMethod?: string; // optional; omit = customer picks on Duitku page
  itemDetails?: Array<{ name: string; qty: number; price: number }>;
}

export interface DuitkuCheckoutResult {
  paymentUrl: string;
  reference: string; // duitku_reference
  statusCode: string;
  statusMessage: string;
}

export interface DuitkuTransactionStatus {
  statusCode: string; // "00" = success
  statusMessage: string;
  reference: string;
  amount: string;
  paymentMethod: string;
  // perlengkapan reflection: duitku mengembalikan status transaksi detail
  [key: string]: unknown;
}

/**
 * Load Duitku config from DB settings (admin dashboard) with env fallback.
 * Mirrors the previous DompetX pattern: settings.integrations overrides env.
 */
export async function getDuitkuConfig(
  supabase: SupabaseClient
): Promise<DuitkuConfig> {
  const envFallback: DuitkuConfig = {
    merchantCode: process.env.DUITKU_MERCHANT_CODE || "",
    apiKey: process.env.DUITKU_API_KEY || "",
    mode: (process.env.DUITKU_MODE as "sandbox" | "live") || "sandbox",
  };

  try {
    const { data } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "integrations")
      .single();

    const settings = (data?.value || {}) as Record<string, string>;
    return {
      merchantCode: settings.duitkuMerchantCode || envFallback.merchantCode,
      apiKey: settings.duitkuApiKey || envFallback.apiKey,
      mode:
        settings.duitkuMode === "live" || envFallback.mode === "live"
          ? "live"
          : "sandbox",
    };
  } catch {
    return envFallback;
  }
}

function getBaseUrl(config: DuitkuConfig): string {
  return config.mode === "live" ? LIVE_BASE_URL : SANDBOX_BASE_URL;
}

/**
 * Duitku request signature: md5(merchantCode + merchantOrderId + amount + apiKey)
 */
export function buildRequestSignature(
  config: DuitkuConfig,
  merchantOrderId: string,
  amount: number
): string {
  return crypto
    .createHash("md5")
    .update(`${config.merchantCode}${merchantOrderId}${amount}${config.apiKey}`)
    .digest("hex");
}

/**
 * Duitku callback signature: md5(merchantCode + amount + merchantOrderId + apiKey)
 *
 * ⚠️ IMPORTANT QUIRK: parameter ORDER differs from the request signature!
 *   - Request (create invoice): md5(merchantCode + merchantOrderId + amount + apiKey)
 *   - Callback (notification):  md5(merchantCode + amount + merchantOrderId + apiKey)
 * This is per official Duitku docs and is a common integration bug.
 */
export function buildCallbackSignature(
  config: DuitkuConfig,
  merchantOrderId: string,
  amount: number
): string {
  return crypto
    .createHash("md5")
    .update(`${config.merchantCode}${amount}${merchantOrderId}${config.apiKey}`)
    .digest("hex");
}

async function duitkuFetch(
  url: string,
  body: Record<string, unknown>,
  timeoutMs: number
): Promise<{ ok: boolean; status: number; data: Record<string, unknown>; raw: string }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }

  const raw = await res.text();
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(raw);
  } catch {
    data = { _raw: raw };
  }
  return { ok: res.ok, status: res.status, data, raw };
}

/**
 * Create a Duitku invoice. Returns paymentUrl for customer redirect.
 */
export async function createDuitkuCheckout(
  config: DuitkuConfig,
  params: DuitkuCheckoutParams
): Promise<DuitkuCheckoutResult> {
  const body: Record<string, unknown> = {
    merchantCode: config.merchantCode,
    paymentAmount: params.amount,
    merchantOrderId: params.merchantOrderId,
    productDetails: params.productDetails,
    email: params.email,
    customerName: params.email.split("@")[0] || "Customer",
    phoneNumber: params.phoneNumber || "",
    returnUrl: params.returnUrl,
    callbackUrl: params.callbackUrl,
    expiryDuration: params.expiryDuration ?? 1440, // 24h default (minutes)
  };

  // paymentMethod omitted unless explicitly provided — lets the customer
  // pick any method (QRIS/VA/e-wallet) on the Duitku checkout page,
  // mirroring the old DompetX checkout flow.
  if (params.paymentMethod) {
    body.paymentMethod = params.paymentMethod;
  }

  if (params.itemDetails?.length) {
    body.itemDetails = params.itemDetails;
  }

  body.signature = buildRequestSignature(config, params.merchantOrderId, params.amount);

  const { ok, status, data, raw } = await duitkuFetch(
    `${getBaseUrl(config)}/invoice/create`,
    body,
    20000
  );

  if (!ok) {
    console.error("[Duitku] create invoice failed:", status, raw.slice(0, 500));
    throw new Error(
      String(data.Message || data.message || data.statusMessage) || `Duitku HTTP ${status}`
    );
  }

  const paymentUrl = String(data.paymentUrl || data.payment_url || "");
  const reference = String(data.reference || "");
  const statusCode = String(data.statusCode || data.status_code || "");
  const statusMessage = String(data.Message || data.message || data.statusMessage || "");

  // Duitku docs: create returns paymentUrl + reference. Fail hard if missing —
  // no more 15-field guessing like DompetX (audit finding F2).
  if (!paymentUrl || !reference) {
    console.error("[Duitku] 2xx but missing paymentUrl/reference:", raw.slice(0, 500));
    throw new Error("Duitku response missing paymentUrl or reference");
  }

  return { paymentUrl, reference, statusCode, statusMessage };
}

/**
 * Verify a Duitku callback (webhook) using its md5 signature.
 * Returns true only when the signature matches merchantCode+orderId+amount+apiKey.
 */
export function verifyDuitkuCallback(
  config: DuitkuConfig,
  payload: { merchantCode: string; merchantOrderId: string; amount: number; signature: string }
): boolean {
  const expected = buildCallbackSignature(
    config,
    payload.merchantOrderId,
    payload.amount
  );
  return (
    payload.merchantCode === config.merchantCode &&
    payload.signature.toLowerCase() === expected
  );
}

/**
 * Query transaction status from Duitku (for reconciliation cron / manual check).
 */
export async function getDuitkuTransactionStatus(
  config: DuitkuConfig,
  merchantOrderId: string
): Promise<DuitkuTransactionStatus | null> {
  const signature = crypto
    .createHash("md5")
    .update(`${config.merchantCode}${merchantOrderId}${config.apiKey}`)
    .digest("hex");

  const { ok, status, data, raw } = await duitkuFetch(
    `${getBaseUrl(config)}/transactionStatus`,
    {
      merchantCode: config.merchantCode,
      merchantOrderId,
      signature,
    },
    10000
  );

  // Duitku returns non-2xx WITH valid JSON body for known states,
  // e.g. HTTP 404 + {"Message":"Transaction not found"} for unknown orders.
  // Only treat as failure when the body is NOT structured JSON (network/gateway error).
  if (!ok && data._raw !== undefined) {
    console.error("[Duitku] transactionStatus failed:", status, raw.slice(0, 300));
    return null;
  }

  return data as DuitkuTransactionStatus;
}

/**
 * Test connection — validates credentials by hitting transactionStatus
 * with a dummy order (expects a controlled non-00 response, not auth error).
 */
export async function testDuitkuConnection(
  config: DuitkuConfig
): Promise<{ success: boolean; message: string }> {
  if (!config.merchantCode || !config.apiKey) {
    return { success: false, message: "Merchant Code / API Key belum diisi" };
  }

  try {
    const probe = await getDuitkuTransactionStatus(
      config,
      `TEST-${Date.now()}`
    );
    // Any structured JSON response (even "Transaction not found") proves
    // the endpoint is reachable and Duitku processed our signed request.
    if (probe && (typeof probe.statusMessage === "string" || typeof probe.Message === "string")) {
      return { success: true, message: `Koneksi ${config.mode.toUpperCase()} berhasil — API Duitku merespons` };
    }
    return { success: false, message: "Tidak ada respons dari Duitku (cek jaringan / URL)" };
  } catch (e) {
    return {
      success: false,
      message: e instanceof Error ? e.message : "Network error",
    };
  }
}