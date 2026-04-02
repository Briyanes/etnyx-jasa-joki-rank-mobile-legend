import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

// POST - Subscribe to push notifications
export async function POST(request: NextRequest) {
  try {
    const { subscription, customerId } = await request.json();

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
    }

    const supabase = await createAdminClient();

    // Upsert subscription (update if endpoint exists, insert if new)
    const { error } = await supabase
      .from("push_subscriptions")
      .upsert({
        customer_id: customerId || null,
        endpoint: subscription.endpoint,
        keys_p256dh: subscription.keys?.p256dh || "",
        keys_auth: subscription.keys?.auth || "",
      }, {
        onConflict: "endpoint",
      });

    if (error) {
      console.error("Error saving subscription:", error);
      return NextResponse.json({ error: "Failed to save subscription" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Subscribed successfully" });
  } catch (error) {
    console.error("Push subscribe error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Unsubscribe from push notifications
export async function DELETE(request: NextRequest) {
  try {
    const { endpoint } = await request.json();

    if (!endpoint) {
      return NextResponse.json({ error: "Endpoint required" }, { status: 400 });
    }

    const supabase = await createAdminClient();

    const { error } = await supabase
      .from("push_subscriptions")
      .delete()
      .eq("endpoint", endpoint);

    if (error) {
      console.error("Error deleting subscription:", error);
      return NextResponse.json({ error: "Failed to unsubscribe" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Unsubscribed successfully" });
  } catch (error) {
    console.error("Push unsubscribe error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
