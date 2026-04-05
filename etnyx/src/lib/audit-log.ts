import { createAdminClient } from "./supabase-server";

export type AuditAction =
  | "create" | "update" | "delete"
  | "login" | "logout"
  | "view_credentials" | "export_data"
  | "upload" | "settings_change";

export type AuditResource =
  | "order" | "testimonial" | "portfolio" | "promo_code"
  | "booster" | "reward_catalog" | "reward_redemption"
  | "staff" | "settings" | "auth" | "file";

interface AuditEntry {
  admin_email: string;
  action: AuditAction;
  resource_type: AuditResource;
  resource_id?: string;
  details?: string;
  old_value?: string;
  new_value?: string;
}

export async function logAdminAction(entry: AuditEntry): Promise<void> {
  try {
    const supabase = await createAdminClient();
    await supabase.from("admin_audit_log").insert({
      admin_email: entry.admin_email,
      action: entry.action,
      resource_type: entry.resource_type,
      resource_id: entry.resource_id || null,
      details: entry.details || null,
      old_value: entry.old_value || null,
      new_value: entry.new_value || null,
    });
  } catch (err) {
    console.error("[AUDIT] Failed to log admin action:", err);
  }
}
