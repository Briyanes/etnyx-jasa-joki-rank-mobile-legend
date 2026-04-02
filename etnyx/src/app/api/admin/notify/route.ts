import { NextResponse } from "next/server";

// WhatsApp notification via wa.me link generator
// In production, integrate with WhatsApp Business API or services like Twilio/Fonnte

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "6281414131321";

interface NotifyRequest {
  customerWhatsapp: string;
  orderId: string;
  status: string;
  progress?: number;
  message?: string;
}

const statusMessages: Record<string, string> = {
  confirmed: "Order kamu sudah dikonfirmasi dan akan segera diproses! ✅",
  in_progress: "Booster sudah mulai mengerjakan ordermu! 🚀",
  completed: "Selamat! Order kamu sudah selesai! 🎉 Terima kasih sudah menggunakan ETNYX.",
  cancelled: "Mohon maaf, order kamu dibatalkan. Hubungi kami untuk info lebih lanjut.",
};

export async function POST(request: Request) {
  const { verifyAdmin } = await import("@/lib/admin-auth");
  const auth = await verifyAdmin();
  if (!auth.authenticated) return auth.error!;

  try {
    const { customerWhatsapp, orderId, status, progress, message }: NotifyRequest = await request.json();

    if (!customerWhatsapp || !orderId) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    // Clean phone number
    let phone = customerWhatsapp.replace(/\D/g, "");
    if (phone.startsWith("0")) {
      phone = "62" + phone.slice(1);
    }

    // Build message
    let notifyMessage = `*ETNYX - Update Order*\n\n`;
    notifyMessage += `📋 Order ID: *${orderId}*\n`;
    notifyMessage += `📊 Status: *${status.replace("_", " ").toUpperCase()}*\n`;
    
    if (progress !== undefined) {
      notifyMessage += `📈 Progress: *${progress}%*\n`;
    }
    
    notifyMessage += `\n${message || statusMessages[status] || "Ada update untuk order kamu."}\n`;
    notifyMessage += `\n🔗 Lacak order: https://etnyx.vercel.app/track?id=${orderId}`;
    notifyMessage += `\n\nTerima kasih! 🙏\n- ETNYX Team`;

    // Generate WhatsApp URL
    const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(notifyMessage)}`;

    // In production with WhatsApp Business API, you would send directly:
    // await sendWhatsAppMessage(phone, notifyMessage);

    return NextResponse.json({ 
      success: true, 
      waUrl,
      message: "Link WhatsApp berhasil dibuat. Klik untuk mengirim notifikasi.",
      phone,
    });
  } catch (error) {
    console.error("Notify error:", error);
    return NextResponse.json({ error: "Gagal membuat notifikasi" }, { status: 500 });
  }
}
