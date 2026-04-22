import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { sanitizeInput } from "@/lib/validation";
import { notifyNewReview, notifyWorkerReport } from "@/lib/notifications";

// GET: Fetch order info for review form
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("orderId");
  const token = searchParams.get("token");

  if (!orderId) {
    return NextResponse.json({ error: "Order ID required" }, { status: 400 });
  }

  const supabase = await createAdminClient();

  // Fetch order
  const { data: order, error } = await supabase
    .from("orders")
    .select("order_id, username, current_rank, target_rank, status, completed_at, assigned_worker_id, review_token")
    .eq("order_id", orderId)
    .single();

  if (error || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Verify token — required for review access
  if (!token || order.review_token !== token) {
    return NextResponse.json({ error: "Token tidak valid" }, { status: 403 });
  }

  if (order.status !== "completed") {
    return NextResponse.json({ error: "Order not completed yet" }, { status: 400 });
  }

  // Check if already reviewed
  const { data: existingReview } = await supabase
    .from("reviews")
    .select("id")
    .eq("order_id", orderId)
    .single();

  if (existingReview) {
    return NextResponse.json({ error: "already_reviewed", message: "Review already submitted" }, { status: 409 });
  }

  // Get worker name if assigned
  let workerName = null;
  if (order.assigned_worker_id) {
    const { data: worker } = await supabase
      .from("staff_users")
      .select("name")
      .eq("id", order.assigned_worker_id)
      .single();
    workerName = worker?.name || null;
  }

  return NextResponse.json({
    order: {
      orderId: order.order_id,
      username: order.username,
      currentRank: order.current_rank,
      targetRank: order.target_rank,
      completedAt: order.completed_at,
      hasWorker: !!order.assigned_worker_id,
      workerName,
    },
  });
}

// POST: Submit review
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      orderId,
      token,
      serviceRating,
      serviceComment,
      workerRating,
      workerComment,
      hasWorkerReport,
      reportType,
      reportDetail,
      customerName,
      customerWhatsapp,
    } = body;

    // Validation
    if (!orderId || !serviceRating) {
      return NextResponse.json({ error: "Order ID and service rating required" }, { status: 400 });
    }

    if (serviceRating < 1 || serviceRating > 5) {
      return NextResponse.json({ error: "Rating must be 1-5" }, { status: 400 });
    }

    if (workerRating && (workerRating < 1 || workerRating > 5)) {
      return NextResponse.json({ error: "Worker rating must be 1-5" }, { status: 400 });
    }

    // Verify order exists and is completed
    const supabase = await createAdminClient();
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("order_id, status, review_token, current_rank, target_rank, assigned_worker_id, customer_id")
      .eq("order_id", orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (!token || order.review_token !== token) {
      return NextResponse.json({ error: "Token tidak valid" }, { status: 403 });
    }

    if (order.status !== "completed") {
      return NextResponse.json({ error: "Order not completed" }, { status: 400 });
    }

    // Check duplicate
    const { data: existing } = await supabase
      .from("reviews")
      .select("id")
      .eq("order_id", orderId)
      .single();

    if (existing) {
      return NextResponse.json({ error: "already_reviewed" }, { status: 409 });
    }

    // Validate report fields
    const validReportTypes = ["cheating", "offering_services", "rude", "account_issue", "other"];
    if (hasWorkerReport && reportType && !validReportTypes.includes(reportType)) {
      return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
    }

    // Insert review
    const reviewData = {
      order_id: orderId,
      customer_id: order.customer_id || null,
      service_rating: serviceRating,
      service_comment: serviceComment ? sanitizeInput(serviceComment).slice(0, 1000) : null,
      worker_id: order.assigned_worker_id || null,
      worker_rating: workerRating || null,
      worker_comment: workerComment ? sanitizeInput(workerComment).slice(0, 1000) : null,
      has_worker_report: !!hasWorkerReport,
      report_type: hasWorkerReport ? reportType : null,
      report_detail: hasWorkerReport && reportDetail ? sanitizeInput(reportDetail).slice(0, 2000) : null,
      customer_name: customerName ? sanitizeInput(customerName).slice(0, 100) : null,
      customer_whatsapp: customerWhatsapp ? sanitizeInput(customerWhatsapp).slice(0, 20) : null,
      rank_from: order.current_rank,
      rank_to: order.target_rank,
    };

    const { data: insertedReview, error: insertError } = await supabase
      .from("reviews")
      .insert(reviewData)
      .select("id")
      .single();

    if (insertError) {
      console.error("Review insert error:", insertError);
      return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
    }

    // If high rating (4-5) and has comment, auto-create as testimonial candidate
    if (serviceRating >= 4 && serviceComment) {
      await supabase.from("testimonials").insert({
        name: customerName || order.order_id,
        rank_from: order.current_rank,
        rank_to: order.target_rank,
        rating: serviceRating,
        comment: sanitizeInput(serviceComment).slice(0, 500),
        is_featured: false,
        is_visible: false, // Admin must approve
      });
    }

    // Send Telegram notifications
    await notifyNewReview({
      order_id: orderId,
      service_rating: serviceRating,
      service_comment: serviceComment?.trim() || null,
      worker_rating: workerRating || null,
      customer_name: customerName?.trim() || null,
      rank_from: order.current_rank,
      rank_to: order.target_rank,
      review_id: insertedReview?.id,
    });

    if (hasWorkerReport && reportType) {
      // Get worker name for report
      let workerName: string | null = null;
      if (order.assigned_worker_id) {
        const { data: worker } = await supabase
          .from("staff_users")
          .select("name")
          .eq("id", order.assigned_worker_id)
          .single();
        workerName = worker?.name || null;
      }

      await notifyWorkerReport({
        order_id: orderId,
        report_type: reportType,
        report_detail: reportDetail?.trim() || null,
        customer_name: customerName?.trim() || null,
        customer_whatsapp: customerWhatsapp?.trim() || null,
        worker_rating: workerRating || null,
        worker_name: workerName,
        review_id: insertedReview?.id,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Review submitted successfully",
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
