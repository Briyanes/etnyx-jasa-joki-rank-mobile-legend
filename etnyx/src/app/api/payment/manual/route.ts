import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { sendNewOrderNotifications } from "@/lib/notifications";

// GET: Fetch order info + bank accounts for manual payment page
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("order_id");

    if (!orderId || !/^ETX-[A-Z0-9-]+$/i.test(orderId)) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    const supabase = await createAdminClient();

    // Fetch order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, order_id, total_price, status, payment_status, payment_method, username")
      .eq("order_id", orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Fetch bank accounts from settings
    let bankAccounts: unknown[] = [];
    try {
      const { data: bankSettings } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "bank_accounts")
        .single();
      if (bankSettings?.value) {
        bankAccounts = Array.isArray(bankSettings.value) ? bankSettings.value : [];
      }
    } catch { /* no bank accounts configured */ }

    // Check if proof already submitted
    const { data: existingProofs } = await supabase
      .from("payment_proofs")
      .select("id")
      .eq("order_id", order.id)
      .limit(1);

    return NextResponse.json({
      order: {
        order_id: order.order_id,
        total_price: order.total_price,
        status: order.status,
        payment_status: order.payment_status,
        payment_method: order.payment_method,
        username: order.username,
      },
      bankAccounts,
      hasProof: (existingProofs?.length || 0) > 0,
    });
  } catch (error) {
    console.error("Manual payment GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: Upload payment proof
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const orderId = formData.get("order_id") as string;
    const senderName = formData.get("sender_name") as string;
    const senderBank = formData.get("sender_bank") as string;

    if (!file || !orderId) {
      return NextResponse.json({ error: "File and order_id required" }, { status: 400 });
    }

    // Validate order ID format
    if (!/^ETX-[A-Z0-9-]+$/i.test(orderId)) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    // Validate file
    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type. Allowed: JPEG, PNG, WebP" }, { status: 400 });
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large. Maximum 5MB" }, { status: 400 });
    }

    const supabase = await createAdminClient();

    // Find order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, order_id, total_price, status, payment_status, username, whatsapp, current_rank, target_rank, package, is_express, is_premium, notes, customer_email")
      .eq("order_id", orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.payment_status === "paid") {
      return NextResponse.json({ error: "Order already paid" }, { status: 400 });
    }

    if (order.status === "cancelled") {
      return NextResponse.json({ error: "Order cancelled" }, { status: 400 });
    }

    // Idempotency: prevent duplicate proof uploads
    const { data: existingProof } = await supabase
      .from("payment_proofs")
      .select("id")
      .eq("order_id", order.id)
      .eq("status", "pending")
      .limit(1);

    if (existingProof && existingProof.length > 0) {
      return NextResponse.json({ error: "Bukti pembayaran sudah diupload dan sedang direview" }, { status: 409 });
    }

    // Also check for approved proof
    const { data: approvedProof } = await supabase
      .from("payment_proofs")
      .select("id")
      .eq("order_id", order.id)
      .eq("status", "approved")
      .limit(1);

    if (approvedProof && approvedProof.length > 0) {
      return NextResponse.json({ error: "Pembayaran sudah dikonfirmasi" }, { status: 409 });
    }

    // Upload file to Supabase Storage
    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `proof-${orderId}-${Date.now()}.${ext}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from("payment-proofs")
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      // Fallback: try creating the bucket first, then retry
      return NextResponse.json({ error: "Failed to upload. Make sure 'payment-proofs' storage bucket exists in Supabase." }, { status: 500 });
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage.from("payment-proofs").getPublicUrl(fileName);

    // Sanitize inputs
    const sanitizedSenderName = senderName ? String(senderName).replace(/<[^>]*>/g, "").slice(0, 100) : null;
    const sanitizedSenderBank = senderBank ? String(senderBank).replace(/<[^>]*>/g, "").slice(0, 50) : null;

    // Insert payment proof record
    const { error: proofError } = await supabase
      .from("payment_proofs")
      .insert({
        order_id: order.id,
        image_url: publicUrl,
        sender_name: sanitizedSenderName,
        sender_bank: sanitizedSenderBank,
        amount: order.total_price,
        status: "pending",
      });

    if (proofError) {
      console.error("Payment proof insert error:", proofError);
      return NextResponse.json({ error: "Failed to save proof" }, { status: 500 });
    }

    // Update order payment_status to pending (proof uploaded, waiting verification)
    await supabase
      .from("orders")
      .update({ payment_status: "pending" })
      .eq("id", order.id);

    // Log
    await supabase.from("order_logs").insert({
      order_id: order.id,
      action: "payment_proof_uploaded",
      new_value: "pending",
      notes: `Manual transfer proof uploaded. Sender: ${sanitizedSenderName || "-"} (${sanitizedSenderBank || "-"})`,
      created_by: "customer",
    });

    // Send Telegram notification to admin about new payment proof
    try {
      const notifModule = await import("@/lib/notifications");
      const { data: integrationSettings } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "integrations")
        .single();
      const adminGroupId = integrationSettings?.value?.telegramAdminGroupId;
      if (adminGroupId) {
        await notifModule.sendTelegramMessage(
          adminGroupId,
        `<b>BUKTI TRANSFER BARU</b>\n\n` +
        `Order: <code>${order.order_id}</code>\n` +
        `${order.username}\n` +
        `${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(order.total_price)}\n` +
        `${sanitizedSenderName || "-"} (${sanitizedSenderBank || "-"})\n\n` +
        `Segera verifikasi di Admin Dashboard`
      );
      }
    } catch (e) {
      console.error("Telegram notification error:", e);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Manual payment POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
