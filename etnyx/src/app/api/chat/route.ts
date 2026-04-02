import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { sanitizeInput } from "@/lib/validation";
import { verifyAdmin } from "@/lib/admin-auth";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

// Helper: verify customer JWT
async function verifyCustomer(): Promise<{ id: string } | null> {
  try {
    if (!process.env.JWT_SECRET) return null;
    const cookieStore = await cookies();
    const token = cookieStore.get("customer_token")?.value;
    if (!token) return null;
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload as { id: string };
  } catch {
    return null;
  }
}

// GET - Fetch chat messages for an order or customer
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");
    const customerId = searchParams.get("customerId");
    const limit = parseInt(searchParams.get("limit") || "50");

    if (!orderId && !customerId) {
      return NextResponse.json({ error: "orderId or customerId required" }, { status: 400 });
    }

    const supabase = await createAdminClient();

    // Auth: admin can see all, customer can only see own messages
    const admin = await verifyAdmin();
    if (!admin.authenticated) {
      const customer = await verifyCustomer();
      if (!customer) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }
      if (orderId) {
        const { data: order } = await supabase
          .from("orders")
          .select("customer_id")
          .eq("order_id", orderId)
          .single();
        if (!order || order.customer_id !== customer.id) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }
      } else if (customerId && customerId !== customer.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    }

    let query = supabase
      .from("chat_messages")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(limit);

    if (orderId) {
      query = query.eq("order_id", orderId);
    } else if (customerId) {
      query = query.eq("customer_id", customerId);
    }

    const { data: messages, error } = await query;

    if (error) {
      console.error("Error fetching messages:", error);
      return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
    }

    return NextResponse.json({ messages: messages || [] });
  } catch (error) {
    console.error("Chat fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Send a chat message
export async function POST(request: NextRequest) {
  try {
    const { orderId, customerId, senderType, message } = await request.json();

    if (!message || !senderType) {
      return NextResponse.json({ error: "Message and senderType required" }, { status: 400 });
    }

    if (!["customer", "admin"].includes(senderType)) {
      return NextResponse.json({ error: "Invalid senderType" }, { status: 400 });
    }

    // Auth based on senderType
    if (senderType === "admin") {
      const admin = await verifyAdmin();
      if (!admin.authenticated) {
        return admin.error!;
      }
    } else {
      const customer = await verifyCustomer();
      if (!customer) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }
      if (customerId && customerId !== customer.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    }

    const supabase = await createAdminClient();

    const sanitizedMessage = sanitizeInput(message);
    if (!sanitizedMessage) {
      return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("chat_messages")
      .insert({
        order_id: orderId || null,
        customer_id: customerId || null,
        sender_type: senderType,
        message: sanitizedMessage,
        is_read: senderType === "customer" ? false : true,
      })
      .select()
      .single();

    if (error) {
      console.error("Error sending message:", error);
      return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: data });
  } catch (error) {
    console.error("Chat send error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH - Mark messages as read
export async function PATCH(request: NextRequest) {
  try {
    const { orderId, customerId, senderType } = await request.json();

    // Auth check
    const admin = await verifyAdmin();
    if (!admin.authenticated) {
      const customer = await verifyCustomer();
      if (!customer) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }
      if (customerId && customerId !== customer.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    }

    const supabase = await createAdminClient();

    let query = supabase
      .from("chat_messages")
      .update({ is_read: true })
      .eq("is_read", false);

    if (orderId) {
      query = query.eq("order_id", orderId);
    }
    if (customerId) {
      query = query.eq("customer_id", customerId);
    }
    if (senderType) {
      // Mark messages NOT from this sender type as read
      query = query.neq("sender_type", senderType);
    }

    const { error } = await query;

    if (error) {
      console.error("Error marking messages read:", error);
      return NextResponse.json({ error: "Failed to mark messages read" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Chat mark read error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
