import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";
import {
  notifyAdminNewOrder,
  notifyWorkerConfirmedOrder,
  notifyAdminOrderCompleted,
  notifyNewReview,
  notifyWorkerReport,
  sendOrderConfirmationWA,
  sendOrderStartedWA,
  sendOrderConfirmationEmail,
} from "@/lib/notifications";

// POST /api/admin/test-notifications
// Test all notification channels with dummy order data
export async function POST(request: NextRequest) {
  const { authenticated, error: authError } = await verifyAdmin();
  if (!authenticated) return authError;

  const body = await request.json();
  const { channels, whatsapp, email } = body;

  const testOrder = {
    order_id: "TEST-ORDER-001",
    username: "TestPlayer123",
    current_rank: "grandmaster",
    target_rank: "mythic",
    package: "boost_rank",
    price: 150000,
    whatsapp: whatsapp || "",
    email: email || "",
    status: "confirmed",
    is_express: true,
    is_premium: false,
    notes: "Ini test notifikasi dari admin dashboard",
  };

  const results: Record<string, { success: boolean; error?: string }> = {};

  // Telegram Admin - New Order
  if (channels?.includes("telegram_admin")) {
    try {
      const ok = await notifyAdminNewOrder(testOrder);
      results.telegram_admin = { success: ok };
      if (!ok) results.telegram_admin.error = "Bot token atau Admin Group ID belum diisi/salah";
    } catch (e) {
      results.telegram_admin = { success: false, error: e instanceof Error ? e.message : String(e) };
    }
  }

  // Telegram Worker - Order Confirmed
  if (channels?.includes("telegram_worker")) {
    try {
      const ok = await notifyWorkerConfirmedOrder(testOrder);
      results.telegram_worker = { success: ok };
      if (!ok) results.telegram_worker.error = "Bot token atau Worker Group ID belum diisi/salah";
    } catch (e) {
      results.telegram_worker = { success: false, error: e instanceof Error ? e.message : String(e) };
    }
  }

  // WhatsApp - Order Confirmation
  if (channels?.includes("whatsapp") && whatsapp) {
    try {
      const ok = await sendOrderConfirmationWA({ ...testOrder, whatsapp });
      results.whatsapp_confirmation = { success: ok };
      if (!ok) results.whatsapp_confirmation.error = "Fonnte API token belum diisi atau nomor salah";
    } catch (e) {
      results.whatsapp_confirmation = { success: false, error: e instanceof Error ? e.message : String(e) };
    }
  }

  // WhatsApp - Order Started
  if (channels?.includes("whatsapp_started") && whatsapp) {
    try {
      const ok = await sendOrderStartedWA({ ...testOrder, whatsapp });
      results.whatsapp_started = { success: ok };
      if (!ok) results.whatsapp_started.error = "Fonnte API token belum diisi atau nomor salah";
    } catch (e) {
      results.whatsapp_started = { success: false, error: e instanceof Error ? e.message : String(e) };
    }
  }

  // Email - Order Confirmation
  if (channels?.includes("email") && email) {
    try {
      const ok = await sendOrderConfirmationEmail({ ...testOrder, email });
      results.email_confirmation = { success: ok };
      if (!ok) results.email_confirmation.error = "Resend API key belum diisi atau email salah";
    } catch (e) {
      results.email_confirmation = { success: false, error: e instanceof Error ? e.message : String(e) };
    }
  }

  // Telegram Admin - Order Completed
  if (channels?.includes("telegram_completed")) {
    try {
      const ok = await notifyAdminOrderCompleted({ ...testOrder, status: "completed" });
      results.telegram_completed = { success: ok };
      if (!ok) results.telegram_completed.error = "Bot token atau Admin Group ID belum diisi/salah";
    } catch (e) {
      results.telegram_completed = { success: false, error: e instanceof Error ? e.message : String(e) };
    }
  }

  // Telegram Review Group - New Review
  if (channels?.includes("telegram_review")) {
    try {
      const ok = await notifyNewReview({
        order_id: "TEST-ORDER-001",
        service_rating: 5,
        service_comment: "Mantap, cepat dan aman! Rekomen banget.",
        worker_rating: 4,
        customer_name: "TestPlayer123",
        rank_from: "grandmaster",
        rank_to: "mythic",
      });
      results.telegram_review = { success: ok };
      if (!ok) results.telegram_review.error = "Review Group ID belum diisi";
    } catch (e) {
      results.telegram_review = { success: false, error: e instanceof Error ? e.message : String(e) };
    }
  }

  // Telegram Report Group - Worker Report
  if (channels?.includes("telegram_report")) {
    try {
      const ok = await notifyWorkerReport({
        order_id: "TEST-ORDER-001",
        report_type: "offering_services",
        report_detail: "Ini adalah test worker report dari admin dashboard",
        customer_name: "TestPlayer123",
        customer_whatsapp: "+6281234567890",
        worker_rating: 2,
        worker_name: "TestWorker",
      });
      results.telegram_report = { success: ok };
      if (!ok) results.telegram_report.error = "Report Group ID belum diisi";
    } catch (e) {
      results.telegram_report = { success: false, error: e instanceof Error ? e.message : String(e) };
    }
  }

  return NextResponse.json({ success: true, results });
}
