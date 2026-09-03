import { describe, it, expect } from "vitest";
import crypto from "crypto";
import {
  buildRequestSignature,
  buildCallbackSignature,
  verifyDuitkuCallback,
  type DuitkuConfig,
} from "@/lib/payments/duitku";

const config: DuitkuConfig = {
  merchantCode: "MCTest123",
  apiKey: "test-api-key-xyz",
  mode: "sandbox",
};

describe("Duitku signatures", () => {
  it("request signature = md5(merchantCode + orderId + amount + apiKey)", () => {
    const sig = buildRequestSignature(config, "ETN-TEST-1", 150000);
    const expected = crypto
      .createHash("md5")
      .update("MCTest123ETN-TEST-1150000test-api-key-xyz")
      .digest("hex");
    expect(sig).toBe(expected);
  });

  it("callback signature = md5(merchantCode + amount + orderId + apiKey) — ORDER QUIRK", () => {
    const sig = buildCallbackSignature(config, "ETN-TEST-1", 150000);
    const expected = crypto
      .createHash("md5")
      .update("MCTest123150000ETN-TEST-1test-api-key-xyz")
      .digest("hex");
    expect(sig).toBe(expected);
  });

  it("request and callback signatures differ for identical inputs (param order)", () => {
    // Regression guard: swapping the concatenation order silently breaks
    // either checkout or callback verification — the #1 Duitku integration bug.
    const req = buildRequestSignature(config, "ETN-TEST-1", 150000);
    const cb = buildCallbackSignature(config, "ETN-TEST-1", 150000);
    expect(req).not.toBe(cb);
  });
});

describe("verifyDuitkuCallback", () => {
  const orderId = "ETN-TEST-1";
  const amount = 150000;

  it("accepts a correctly signed callback", () => {
    const signature = buildCallbackSignature(config, orderId, amount);
    expect(
      verifyDuitkuCallback(config, { merchantCode: config.merchantCode, merchantOrderId: orderId, amount, signature })
    ).toBe(true);
  });

  it("accepts uppercase signatures (case-insensitive compare)", () => {
    const signature = buildCallbackSignature(config, orderId, amount).toUpperCase();
    expect(
      verifyDuitkuCallback(config, { merchantCode: config.merchantCode, merchantOrderId: orderId, amount, signature })
    ).toBe(true);
  });

  it("rejects a tampered amount (signature for 150000, claims 100000)", () => {
    const signature = buildCallbackSignature(config, orderId, 150000);
    expect(
      verifyDuitkuCallback(config, { merchantCode: config.merchantCode, merchantOrderId: orderId, amount: 100000, signature })
    ).toBe(false);
  });

  it("rejects a foreign merchantCode", () => {
    const signature = buildCallbackSignature(config, orderId, amount);
    expect(
      verifyDuitkuCallback(config, { merchantCode: "EVIL-MERCHANT", merchantOrderId: orderId, amount, signature })
    ).toBe(false);
  });

  it("rejects garbage signatures", () => {
    expect(
      verifyDuitkuCallback(config, { merchantCode: config.merchantCode, merchantOrderId: orderId, amount, signature: "deadbeef" })
    ).toBe(false);
  });
});
