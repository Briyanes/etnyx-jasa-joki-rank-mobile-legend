import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { verifyAdmin } from "@/lib/admin-auth";
import { sanitizeInput } from "@/lib/validation";

// GET: Fetch payment proof for an order (admin only)
export async function GET(request: NextRequest) {
  const auth = await verifyAdmin();
  if (!auth.authenticated) return auth.error!;

  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("order_id");

    if (!orderId) {
      return NextResponse.json({ error: "order_id required" }, { status: 400 });
    }

    const supabase = await createAdminClient();

    const { data: proofs, error } = await supabase
      .from("payment_proofs")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Payment proof fetch error:", error);
      return NextResponse.json({ error: "Failed to fetch proofs" }, { status: 500 });
    }

    return NextResponse.json({ proofs: proofs || [] });
  } catch (error) {
    console.error("Payment proof API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: Approve or reject payment proof (admin only)
export async function POST(request: NextRequest) {
  const auth = await verifyAdmin();
  if (!auth.authenticated) return auth.error!;

  try {
    const body = await request.json();
    const { proofId, action, rejectReason } = body;

    if (!proofId || !action || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "proofId and action (approve/reject) required" }, { status: 400 });
    }

    const supabase = await createAdminClient();

    // Fetch proof
    const { data: proof, error: proofError } = await supabase
      .from("payment_proofs")
      .select("*, orders!inner(id, order_id, status, payment_status, total_price, username, whatsapp, current_rank, target_rank, package, is_express, is_premium, notes, customer_email)")
      .eq("id", proofId)
      .single();

    if (proofError || !proof) {
      return NextResponse.json({ error: "Proof not found" }, { status: 404 });
    }

    if (action === "approve") {
      // Update proof status
      await supabase
        .from("payment_proofs")
        .update({
          status: "approved",
          reviewed_by: auth.user!.email,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", proofId);

      // Only update order if not already paid (idempotency — prevents double notifications if admin also clicked "Konfirmasi Bayar")
      const order = proof.orders;
      const alreadyPaid = order.payment_status === "paid" && order.status === "confirmed";

      if (!alreadyPaid) {
        await supabase
          .from("orders")
          .update({
            payment_status: "paid",
            status: "confirmed",
            paid_at: new Date().toISOString(),
            confirmed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", order.id);

        // Log
        await supabase.from("order_logs").insert({
          order_id: order.id,
          action: "payment_confirmed",
          new_value: "paid",
          notes: `Manual transfer approved by ${auth.user!.email}`,
          created_by: auth.user!.email,
        });

        // Send notifications only if order wasn't already confirmed
        try {
          const { sendPaymentConfirmedWA, notifyWorkerConfirmedOrder } = await import("@/lib/notifications");
          const orderData = {
            order_id: order.order_id,
            username: order.username,
            current_rank: order.current_rank,
            target_rank: order.target_rank,
            package: order.package,
            price: order.total_price,
            whatsapp: order.whatsapp,
            email: order.customer_email,
            status: "confirmed",
            is_express: order.is_express,
            is_premium: order.is_premium,
            notes: order.notes,
          };
          // WA to customer: "Pembayaran Dikonfirmasi"
          await sendPaymentConfirmedWA(orderData);
          // Telegram to worker group: order ready to be assigned
          await notifyWorkerConfirmedOrder(orderData);

          // Fire Meta CAPI Purchase for manual transfer (attribution)
          try {
            const { sendMetaCAPI } = await import("@/lib/meta-capi");
            const { data: pixelSettings } = await supabase
              .from("settings")
              .select("value")
              .eq("key", "tracking_pixels")
              .single();
            if (pixelSettings?.value) {
              await sendMetaCAPI(
                {
                  eventName: "Purchase",
                  eventId: `purchase_manual_${order.order_id}`,
                  value: order.total_price || 0,
                  currency: "IDR",
                  email: order.customer_email,
                  phone: order.whatsapp,
                  orderId: order.order_id,
                },
                pixelSettings.value
              );
            }
          } catch (e) {
            console.error("Meta CAPI error (manual):", e);
          }
        } catch (e) {
          console.error("Notification error:", e);
        }
      }

      return NextResponse.json({ success: true, action: "approved" });
    } else {
      // Reject
      await supabase
        .from("payment_proofs")
        .update({
          status: "rejected",
          reviewed_by: auth.user!.email,
          reviewed_at: new Date().toISOString(),
          reject_reason: rejectReason ? sanitizeInput(String(rejectReason)).slice(0, 500) : null,
        })
        .eq("id", proofId);

      // Log
      await supabase.from("order_logs").insert({
        order_id: proof.orders.id,
        action: "payment_rejected",
        new_value: "rejected",
        notes: `Manual transfer rejected by ${auth.user!.email}. Reason: ${rejectReason || "N/A"}`,
        created_by: auth.user!.email,
      });

      return NextResponse.json({ success: true, action: "rejected" });
    }
  } catch (error) {
    console.error("Payment proof POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
