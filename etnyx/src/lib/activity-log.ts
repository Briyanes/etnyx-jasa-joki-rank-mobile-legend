import { createAdminClient } from "./supabase-server";

export async function logCustomerActivity(
  customerId: string,
  action: string,
  details: Record<string, unknown> = {},
  request?: { headers?: Headers }
) {
  try {
    const supabase = await createAdminClient();
    const ip = request?.headers?.get("x-forwarded-for")?.split(",")[0]?.trim() ||
               request?.headers?.get("x-real-ip") || null;
    const userAgent = request?.headers?.get("user-agent") || null;

    await supabase.from("customer_activity_log").insert({
      customer_id: customerId,
      action,
      details,
      ip_address: ip,
      user_agent: userAgent,
    });
  } catch {
    // Don't block main flow if activity logging fails
    console.warn("Failed to log customer activity:", action);
  }
}
