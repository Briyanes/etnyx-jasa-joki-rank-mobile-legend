import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { verifyAdmin } from "@/lib/admin-auth";

// GET — list all banned IPs and WhatsApp numbers
export async function GET() {
  try {
    const authResult = await verifyAdmin();
    if (!authResult.authenticated) {
      return authResult.error || NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createAdminClient();

    const [ipsResult, waResult, emailResult, gameIdResult] = await Promise.all([
      supabase
        .from("banned_ips")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("banned_whatsapp")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("banned_emails")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("banned_game_ids")
        .select("*")
        .order("created_at", { ascending: false }),
    ]);

    return NextResponse.json({
      bannedIps: ipsResult.data || [],
      bannedWhatsapp: waResult.data || [],
      bannedEmails: emailResult.data || [],
      bannedGameIds: gameIdResult.data || [],
    });
  } catch (error) {
    console.error("Error fetching banned list:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data ban list" },
      { status: 500 }
    );
  }
}

// POST — add a new ban (IP or WhatsApp)
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAdmin();
    if (!authResult.authenticated) {
      return authResult.error || NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { type, value, reason } = body;

    if (!type || !value) {
      return NextResponse.json(
        { error: "Type dan value wajib diisi" },
        { status: 400 }
      );
    }

    const supabase = await createAdminClient();
    const bannedBy = authResult.user?.email || "admin";

    if (type === "ip") {
      const { error } = await supabase
        .from("banned_ips")
        .upsert({
          ip_address: value,
          reason: reason || "Manual ban by admin",
          auto_banned: false,
          banned_by: bannedBy,
        }, { onConflict: "ip_address", ignoreDuplicates: true });

      if (error) {
        return NextResponse.json({ error: "Gagal ban IP" }, { status: 500 });
      }
    } else if (type === "whatsapp") {
      const { error } = await supabase
        .from("banned_whatsapp")
        .upsert({
          whatsapp: value,
          reason: reason || "Manual ban by admin",
          auto_banned: false,
          banned_by: bannedBy,
        }, { onConflict: "whatsapp", ignoreDuplicates: true });

      if (error) {
        return NextResponse.json({ error: "Gagal ban WhatsApp" }, { status: 500 });
      }
    } else if (type === "email") {
      const { error } = await supabase
        .from("banned_emails")
        .upsert({
          email: value.toLowerCase(),
          reason: reason || "Manual ban by admin",
          auto_banned: false,
          banned_by: bannedBy,
        }, { onConflict: "email", ignoreDuplicates: true });

      if (error) {
        return NextResponse.json({ error: "Gagal ban Email" }, { status: 500 });
      }
    } else if (type === "game_id") {
      const { error } = await supabase
        .from("banned_game_ids")
        .upsert({
          game_id: value.replace(/\D/g, ""),
          reason: reason || "Manual ban by admin",
          auto_banned: false,
          banned_by: bannedBy,
        }, { onConflict: "game_id", ignoreDuplicates: true });

      if (error) {
        return NextResponse.json({ error: "Gagal ban Game ID" }, { status: 500 });
      }
    } else {
      return NextResponse.json(
        { error: "Type harus 'ip', 'whatsapp', 'email', atau 'game_id'" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error adding ban:", error);
    return NextResponse.json(
      { error: "Gagal menambahkan ban" },
      { status: 500 }
    );
  }
}

// DELETE — remove a ban
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await verifyAdmin();
    if (!authResult.authenticated) {
      return authResult.error || NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const value = searchParams.get("value");

    if (!type || !value) {
      return NextResponse.json(
        { error: "Type dan value wajib diisi" },
        { status: 400 }
      );
    }

    const supabase = await createAdminClient();

    if (type === "ip") {
      const { error } = await supabase
        .from("banned_ips")
        .delete()
        .eq("ip_address", value);

      if (error) {
        return NextResponse.json({ error: "Gagal unban IP" }, { status: 500 });
      }
    } else if (type === "whatsapp") {
      const { error } = await supabase
        .from("banned_whatsapp")
        .delete()
        .eq("whatsapp", value);

      if (error) {
        return NextResponse.json({ error: "Gagal unban WhatsApp" }, { status: 500 });
      }
    } else if (type === "email") {
      const { error } = await supabase
        .from("banned_emails")
        .delete()
        .eq("email", value);

      if (error) {
        return NextResponse.json({ error: "Gagal unban Email" }, { status: 500 });
      }
    } else if (type === "game_id") {
      const { error } = await supabase
        .from("banned_game_ids")
        .delete()
        .eq("game_id", value);

      if (error) {
        return NextResponse.json({ error: "Gagal unban Game ID" }, { status: 500 });
      }
    } else {
      return NextResponse.json(
        { error: "Type harus 'ip', 'whatsapp', 'email', atau 'game_id'" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing ban:", error);
    return NextResponse.json(
      { error: "Gagal menghapus ban" },
      { status: 500 }
    );
  }
}