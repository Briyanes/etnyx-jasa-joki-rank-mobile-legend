import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { verifyAdmin } from "@/lib/admin-auth";
import webpush from "web-push";

// Configure web-push with VAPID keys
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || "";

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    "mailto:admin@etnyx.com",
    vapidPublicKey,
    vapidPrivateKey
  );
}

// POST - Send push notification
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const auth = await verifyAdmin();
    if (!auth.authenticated) return auth.error!;

    const { customerId, orderId, title, body, url } = await request.json();

    if (!title || !body) {
      return NextResponse.json({ error: "Title and body required" }, { status: 400 });
    }

    if (!vapidPublicKey || !vapidPrivateKey) {
      return NextResponse.json({ error: "Push notifications not configured" }, { status: 500 });
    }

    const supabase = await createAdminClient();

    // Get subscriptions
    let query = supabase.from("push_subscriptions").select("*");
    
    if (customerId) {
      query = query.eq("customer_id", customerId);
    }

    const { data: subscriptions, error: fetchError } = await query;

    if (fetchError) {
      console.error("Error fetching subscriptions:", fetchError);
      return NextResponse.json({ error: "Failed to fetch subscriptions" }, { status: 500 });
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ success: true, message: "No subscriptions found", sent: 0 });
    }

    const payload = JSON.stringify({
      title,
      body,
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-72x72.png",
      url: url || "/",
      timestamp: Date.now(),
    });

    let sent = 0;
    let failed = 0;

    // Send to all subscriptions
    for (const sub of subscriptions) {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.keys_p256dh,
          auth: sub.keys_auth,
        },
      };

      try {
        await webpush.sendNotification(pushSubscription, payload);
        sent++;

        // Log notification
        await supabase.from("notification_logs").insert({
          customer_id: sub.customer_id,
          order_id: orderId || null,
          type: "push",
          title,
          body,
          status: "sent",
        });
      } catch (error: unknown) {
        failed++;
        console.error("Push send error:", error);

        // Remove invalid subscriptions (410 Gone)
        if (error && typeof error === "object" && "statusCode" in error && error.statusCode === 410) {
          await supabase
            .from("push_subscriptions")
            .delete()
            .eq("endpoint", sub.endpoint);
        }
      }
    }

    return NextResponse.json({
      success: true,
      sent,
      failed,
      total: subscriptions.length,
    });
  } catch (error) {
    console.error("Push send error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET - Get VAPID public key
export async function GET() {
  return NextResponse.json({
    publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "",
  });
}
