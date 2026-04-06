/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Client-side conversion tracking utility.
 * Fires events to Meta Pixel, Google Ads/GA4, TikTok Pixel via their global objects.
 */

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    gtag?: (...args: any[]) => void;
    ttq?: { track: (...args: any[]) => void };
    dataLayer?: any[];
  }
}

interface ConversionData {
  orderId: string;
  value: number;       // IDR
  currency?: string;
}

/** Fire Purchase event to all pixel platforms */
export function trackPurchase({ orderId, value, currency = "IDR" }: ConversionData) {
  // Meta Pixel — Purchase
  if (typeof window.fbq === "function") {
    window.fbq("track", "Purchase", {
      value,
      currency,
      content_ids: [orderId],
      content_type: "product",
    });
  }

  // Google Ads + GA4 — purchase
  if (typeof window.gtag === "function") {
    window.gtag("event", "purchase", {
      transaction_id: orderId,
      value,
      currency,
    });
    // Also fire Google Ads conversion (if conversion label exists it'll be picked up by gtag)
    window.gtag("event", "conversion", {
      send_to: undefined, // will auto-resolve to configured Google Ads ID
      transaction_id: orderId,
      value,
      currency,
    });
  }

  // TikTok Pixel — CompletePayment
  if (window.ttq?.track) {
    window.ttq.track("CompletePayment", {
      content_id: orderId,
      content_type: "product",
      value,
      currency,
    });
  }
}

/** Fire InitiateCheckout event (when order is submitted) */
export function trackInitiateCheckout({ orderId, value, currency = "IDR" }: ConversionData) {
  if (typeof window.fbq === "function") {
    window.fbq("track", "InitiateCheckout", {
      value,
      currency,
      content_ids: [orderId],
      content_type: "product",
    });
  }

  if (typeof window.gtag === "function") {
    window.gtag("event", "begin_checkout", {
      value,
      currency,
      items: [{ item_id: orderId, quantity: 1 }],
    });
  }

  if (window.ttq?.track) {
    window.ttq.track("InitiateCheckout", {
      content_id: orderId,
      content_type: "product",
      value,
      currency,
    });
  }
}

/** Fire Lead event (CTWA click, WhatsApp contact) */
export function trackLead(data?: { value?: number; currency?: string }) {
  if (typeof window.fbq === "function") {
    window.fbq("track", "Lead", data || {});
  }

  if (typeof window.gtag === "function") {
    window.gtag("event", "generate_lead", {
      value: data?.value || 0,
      currency: data?.currency || "IDR",
    });
  }

  if (window.ttq?.track) {
    window.ttq.track("SubmitForm", data || {});
  }
}

/** Fire ViewContent event (order page view) */
export function trackViewContent(data?: { value?: number; contentName?: string }) {
  if (typeof window.fbq === "function") {
    window.fbq("track", "ViewContent", {
      content_name: data?.contentName || "Order Page",
      value: data?.value || 0,
      currency: "IDR",
    });
  }

  if (typeof window.gtag === "function") {
    window.gtag("event", "view_item", {
      items: [{ item_name: data?.contentName || "Order Page" }],
      value: data?.value || 0,
      currency: "IDR",
    });
  }

  if (window.ttq?.track) {
    window.ttq.track("ViewContent", {
      content_name: data?.contentName || "Order Page",
      value: data?.value || 0,
      currency: "IDR",
    });
  }
}

/**
 * Capture UTM params + click IDs from URL and store in sessionStorage.
 * Call this on page load (homepage, order page, etc.)
 */
export function captureUtmParams() {
  if (typeof window === "undefined") return;
  
  const params = new URLSearchParams(window.location.search);
  const utmKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "gclid", "ttclid"];
  
  for (const key of utmKeys) {
    const val = params.get(key);
    if (val) {
      sessionStorage.setItem(`etnyx_${key}`, val);
    }
  }

  // Also store referrer if not from same site
  if (document.referrer && !document.referrer.includes(window.location.hostname)) {
    sessionStorage.setItem("etnyx_referrer_url", document.referrer);
  }
}

/** Get stored UTM params for order submission */
export function getStoredUtmParams(): Record<string, string> {
  if (typeof window === "undefined") return {};
  
  const result: Record<string, string> = {};
  const keys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "gclid", "ttclid", "referrer_url"];
  
  for (const key of keys) {
    const val = sessionStorage.getItem(`etnyx_${key}`);
    if (val) result[key] = val;
  }

  // Auto-detect source from click IDs if utm_source is missing
  if (!result.utm_source) {
    if (result.fbclid) result.utm_source = "meta";
    else if (result.gclid) result.utm_source = "google";
    else if (result.ttclid) result.utm_source = "tiktok";
  }

  return result;
}
