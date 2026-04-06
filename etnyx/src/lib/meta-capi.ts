import crypto from "crypto";

interface CAPIEventData {
  eventName: "Purchase" | "InitiateCheckout" | "Lead";
  eventId: string;
  value: number;
  currency: string;
  email?: string | null;
  phone?: string | null;
  orderId: string;
  sourceUrl?: string;
  userAgent?: string;
  ipAddress?: string;
}

interface PixelSettings {
  metaPixelId: string;
  metaAccessToken: string;
  isMetaEnabled: boolean;
}

function hashSHA256(value: string): string {
  return crypto.createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

/**
 * Send server-side conversion event to Meta Conversions API.
 * Deduplicates with client-side pixel via event_id.
 */
export async function sendMetaCAPI(event: CAPIEventData, pixels: PixelSettings): Promise<boolean> {
  if (!pixels.isMetaEnabled || !pixels.metaPixelId || !pixels.metaAccessToken) {
    return false;
  }

  const userData: Record<string, string> = {};
  if (event.email) userData.em = hashSHA256(event.email);
  if (event.phone) {
    // Normalize phone: ensure +62 format, remove non-digits
    const cleanPhone = event.phone.replace(/\D/g, "");
    userData.ph = hashSHA256(cleanPhone);
  }
  if (event.ipAddress) userData.client_ip_address = event.ipAddress;
  if (event.userAgent) userData.client_user_agent = event.userAgent;

  const payload = {
    data: [
      {
        event_name: event.eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: event.eventId, // For deduplication with client-side pixel
        action_source: "website",
        event_source_url: event.sourceUrl || undefined,
        user_data: userData,
        custom_data: {
          value: event.value,
          currency: event.currency,
          content_ids: [event.orderId],
          content_type: "product",
          order_id: event.orderId,
        },
      },
    ],
  };

  try {
    const url = `https://graph.facebook.com/v21.0/${encodeURIComponent(pixels.metaPixelId)}/events?access_token=${encodeURIComponent(pixels.metaAccessToken)}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Meta CAPI error:", err);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Meta CAPI fetch error:", err);
    return false;
  }
}
