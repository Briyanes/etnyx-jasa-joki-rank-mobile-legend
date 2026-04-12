import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { verifyAdmin } from "@/lib/admin-auth";
import { WHATSAPP_NUMBER } from "@/lib/constants";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

// GET - Generate invoice HTML/PDF for an order
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");
    const format = searchParams.get("format") || "html"; // html or pdf

    if (!orderId) {
      return NextResponse.json({ error: "orderId required" }, { status: 400 });
    }

    const supabase = await createAdminClient();

    // Auth: require admin token or customer JWT
    const admin = await verifyAdmin();
    let customerPhone: string | null = null;

    if (!admin.authenticated) {
      // Try customer JWT auth
      try {
        const { jwtVerify: jv } = await import("jose");
        const { cookies: getCookies } = await import("next/headers");
        const cookieStore = await getCookies();
        const token = cookieStore.get("customer_token")?.value;
        if (!token || !process.env.JWT_SECRET) {
          return NextResponse.json({ error: "Authentication required" }, { status: 401 });
        }
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jv(token, secret);
        if (payload.id) {
          const { data: cust } = await supabase.from("customers").select("whatsapp").eq("id", payload.id).single();
          customerPhone = cust?.whatsapp || null;
        }
        if (!customerPhone) {
          return NextResponse.json({ error: "Authentication required" }, { status: 401 });
        }
      } catch {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }
    }

    // Fetch order with customer
    const { data: order, error } = await supabase
      .from("orders")
      .select("*, customers(*)")
      .eq("id", orderId)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Verify ownership for customer requests
    if (!admin.authenticated && customerPhone) {
      const orderWhatsapp = order.whatsapp || order.customers?.whatsapp || "";
      if (orderWhatsapp !== customerPhone) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    }

    const invoiceDate = new Date(order.created_at).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const paidDate = order.paid_at
      ? new Date(order.paid_at).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "-";

    const invoiceNumber = `INV-${order.order_id}`;

    // Generate HTML invoice
    const invoiceHtml = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${invoiceNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f5f5; padding: 20px; }
    .invoice { max-width: 800px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 40px; }
    .header h1 { font-size: 32px; margin-bottom: 8px; }
    .header p { opacity: 0.9; }
    .logo { font-size: 24px; font-weight: bold; margin-bottom: 20px; }
    .content { padding: 40px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
    .info-block h3 { font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
    .info-block p { color: #333; font-size: 14px; line-height: 1.6; }
    .table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
    .table th { background: #f8f9fa; padding: 16px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #666; border-bottom: 2px solid #e9ecef; }
    .table td { padding: 16px; border-bottom: 1px solid #e9ecef; }
    .table .price { text-align: right; font-weight: 600; }
    .total-section { border-top: 2px solid #e9ecef; padding-top: 20px; }
    .total-row { display: flex; justify-content: space-between; padding: 8px 0; }
    .total-row.grand { font-size: 20px; font-weight: bold; color: #6366f1; border-top: 2px solid #6366f1; padding-top: 16px; margin-top: 8px; }
    .status { display: inline-block; padding: 8px 16px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
    .status.paid { background: #d1fae5; color: #059669; }
    .status.unpaid { background: #fee2e2; color: #dc2626; }
    .status.pending { background: #fef3c7; color: #d97706; }
    .footer { background: #f8f9fa; padding: 30px 40px; text-align: center; }
    .footer p { color: #666; font-size: 14px; }
    .footer a { color: #6366f1; text-decoration: none; }
    @media print {
      body { background: white; padding: 0; }
      .invoice { box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="invoice">
    <div class="header">
      <div class="logo">ETNYX</div>
      <h1>INVOICE</h1>
      <p>${invoiceNumber}</p>
    </div>
    
    <div class="content">
      <div class="info-grid">
        <div class="info-block">
          <h3>Ditagihkan Kepada</h3>
          <p><strong>${order.customers?.name || order.customer_name || "Customer"}</strong></p>
          <p>${order.customers?.email || "-"}</p>
          <p>${order.whatsapp || order.customers?.whatsapp || "-"}</p>
        </div>
        <div class="info-block" style="text-align: right;">
          <h3>Detail Invoice</h3>
          <p><strong>Tanggal:</strong> ${invoiceDate}</p>
          <p><strong>Dibayar:</strong> ${paidDate}</p>
          <p><strong>Status:</strong> <span class="status ${order.payment_status === 'paid' ? 'paid' : order.payment_status === 'unpaid' ? 'unpaid' : 'pending'}">${order.payment_status === 'paid' ? 'Lunas' : order.payment_status === 'unpaid' ? 'Belum Bayar' : 'Pending'}</span></p>
        </div>
      </div>
      
      <table class="table">
        <thead>
          <tr>
            <th>Deskripsi</th>
            <th>Detail</th>
            <th class="price">Harga</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>Jasa Joki & Gendong Mobile Legends</strong><br>
              <span style="color: #666; font-size: 13px;">Push Rank Service</span>
            </td>
            <td>
              ${order.current_rank || "Warrior"} → ${order.target_rank || "Mythic"}<br>
              <span style="color: #666; font-size: 13px;">
                ${order.is_express && order.is_premium ? 'Express Premium' : order.is_express ? 'Express' : order.is_premium ? 'Premium' : 'Standard'}
              </span>
            </td>
            <td class="price">Rp ${(order.total_price || 0).toLocaleString("id-ID")}</td>
          </tr>
          ${order.promo_code ? `
          <tr>
            <td colspan="2">
              <strong>Promo Code:</strong> ${order.promo_code}
            </td>
            <td class="price" style="color: #059669;">- Rp ${(order.promo_discount || 0).toLocaleString("id-ID")}</td>
          </tr>
          ` : ''}
          ${(order.tier_discount || 0) > 0 ? `
          <tr>
            <td colspan="2">
              <strong>Tier ${(order.tier_name || '').charAt(0).toUpperCase() + (order.tier_name || '').slice(1)} Discount</strong>
            </td>
            <td class="price" style="color: #059669;">- Rp ${(order.tier_discount || 0).toLocaleString("id-ID")}</td>
          </tr>
          ` : ''}
        </tbody>
      </table>
      
      <div class="total-section">
        <div class="total-row">
          <span>Subtotal</span>
          <span>Rp ${(order.total_price || 0).toLocaleString("id-ID")}</span>
        </div>
        ${(order.promo_discount || 0) > 0 || (order.tier_discount || 0) > 0 ? `
        <div class="total-row">
          <span>Diskon</span>
          <span style="color: #059669;">- Rp ${((order.promo_discount || 0) + (order.tier_discount || 0)).toLocaleString("id-ID")}</span>
        </div>
        ` : ''}
        <div class="total-row grand">
          <span>Total</span>
          <span>Rp ${((order.total_price || 0) - (order.promo_discount || 0) - (order.tier_discount || 0)).toLocaleString("id-ID")}</span>
        </div>
      </div>
    </div>
    
    <div class="footer">
      <p>Terima kasih telah menggunakan layanan <strong>ETNYX</strong></p>
      <p>Pertanyaan? Hubungi kami di <a href="https://wa.me/${WHATSAPP_NUMBER}">WhatsApp</a></p>
    </div>
  </div>
  
  <script>
    // Auto print if opened for PDF
    if (window.location.search.includes('print=true')) {
      window.onload = function() {
        window.print();
      }
    }
  </script>
</body>
</html>`;

    if (format === "html") {
      return new NextResponse(invoiceHtml, {
        headers: {
          "Content-Type": "text/html",
        },
      });
    }

    // Generate real PDF using pdf-lib
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const { height } = page.getSize();

    const primary = rgb(0.39, 0.4, 0.95); // #6366f1
    const black = rgb(0, 0, 0);
    const gray = rgb(0.4, 0.4, 0.4);
    const green = rgb(0.02, 0.59, 0.41);
    const white = rgb(1, 1, 1);

    // Header background
    page.drawRectangle({ x: 0, y: height - 120, width: 595, height: 120, color: primary });

    // Header text
    page.drawText("ETNYX", { x: 40, y: height - 45, size: 20, font: fontBold, color: white });
    page.drawText("INVOICE", { x: 40, y: height - 75, size: 28, font: fontBold, color: white });
    page.drawText(invoiceNumber, { x: 40, y: height - 95, size: 11, font, color: rgb(0.9, 0.9, 1) });

    let y = height - 150;

    // Billing info
    page.drawText("DITAGIHKAN KEPADA", { x: 40, y, size: 8, font: fontBold, color: gray });
    y -= 16;
    page.drawText(order.customers?.name || order.customer_name || "Customer", { x: 40, y, size: 11, font: fontBold, color: black });
    y -= 14;
    page.drawText(order.customers?.email || "-", { x: 40, y, size: 9, font, color: gray });
    y -= 13;
    page.drawText(order.whatsapp || order.customers?.whatsapp || "-", { x: 40, y, size: 9, font, color: gray });

    // Invoice details (right side)
    const rx = 350;
    let ry = height - 150;
    page.drawText("DETAIL INVOICE", { x: rx, y: ry, size: 8, font: fontBold, color: gray });
    ry -= 16;
    page.drawText(`Tanggal: ${invoiceDate}`, { x: rx, y: ry, size: 9, font, color: black });
    ry -= 14;
    page.drawText(`Dibayar: ${paidDate}`, { x: rx, y: ry, size: 9, font, color: black });
    ry -= 14;
    const statusText = order.payment_status === "paid" ? "LUNAS" : order.payment_status === "unpaid" ? "BELUM BAYAR" : "PENDING";
    const statusColor = order.payment_status === "paid" ? green : order.payment_status === "unpaid" ? rgb(0.86, 0.15, 0.15) : rgb(0.85, 0.47, 0.02);
    page.drawText(`Status: ${statusText}`, { x: rx, y: ry, size: 9, font: fontBold, color: statusColor });

    // Separator
    y -= 40;
    page.drawRectangle({ x: 40, y, width: 515, height: 1, color: rgb(0.9, 0.9, 0.9) });
    y -= 25;

    // Table header
    page.drawRectangle({ x: 40, y: y - 5, width: 515, height: 22, color: rgb(0.97, 0.97, 0.97) });
    page.drawText("DESKRIPSI", { x: 50, y, size: 8, font: fontBold, color: gray });
    page.drawText("DETAIL", { x: 270, y, size: 8, font: fontBold, color: gray });
    page.drawText("HARGA", { x: 480, y, size: 8, font: fontBold, color: gray });
    y -= 28;

    // Service row
    page.drawText("Jasa Joki & Gendong ML", { x: 50, y, size: 10, font: fontBold, color: black });
    y -= 14;
    page.drawText("Push Rank Service", { x: 50, y, size: 8, font, color: gray });

    const modeLabel = order.is_express && order.is_premium ? "Express Premium" : order.is_express ? "Express" : order.is_premium ? "Premium" : "Standard";
    page.drawText(`${order.current_rank || "Warrior"} → ${order.target_rank || "Mythic"}`, { x: 270, y: y + 14, size: 9, font, color: black });
    page.drawText(modeLabel, { x: 270, y, size: 8, font, color: gray });

    const totalPrice = order.total_price || 0;
    const promoDiscount = order.promo_discount || 0;
    const tierDiscount = order.tier_discount || 0;
    const fmtTotal = `Rp ${totalPrice.toLocaleString("id-ID")}`;
    page.drawText(fmtTotal, { x: 460, y: y + 14, size: 10, font: fontBold, color: black });

    y -= 20;
    page.drawRectangle({ x: 40, y, width: 515, height: 1, color: rgb(0.9, 0.9, 0.9) });
    y -= 20;

    // Promo row
    if (order.promo_code && promoDiscount > 0) {
      page.drawText(`Promo Code: ${order.promo_code}`, { x: 50, y, size: 9, font, color: black });
      page.drawText(`- Rp ${promoDiscount.toLocaleString("id-ID")}`, { x: 460, y, size: 10, font: fontBold, color: green });
      y -= 20;
      page.drawRectangle({ x: 40, y, width: 515, height: 1, color: rgb(0.9, 0.9, 0.9) });
      y -= 20;
    }

    // Tier discount row
    if (tierDiscount > 0) {
      const tierLabel = order.tier_name ? `Tier ${order.tier_name.charAt(0).toUpperCase() + order.tier_name.slice(1)} Discount` : 'Tier Discount';
      page.drawText(tierLabel, { x: 50, y, size: 9, font, color: black });
      page.drawText(`- Rp ${tierDiscount.toLocaleString("id-ID")}`, { x: 460, y, size: 10, font: fontBold, color: green });
      y -= 20;
      page.drawRectangle({ x: 40, y, width: 515, height: 1, color: rgb(0.9, 0.9, 0.9) });
      y -= 20;
    }

    // Total section
    page.drawText("Subtotal", { x: 350, y, size: 9, font, color: gray });
    page.drawText(`Rp ${totalPrice.toLocaleString("id-ID")}`, { x: 460, y, size: 9, font, color: black });
    y -= 16;

    if (promoDiscount > 0 || tierDiscount > 0) {
      const totalDiscount = promoDiscount + tierDiscount;
      page.drawText("Diskon", { x: 350, y, size: 9, font, color: gray });
      page.drawText(`- Rp ${totalDiscount.toLocaleString("id-ID")}`, { x: 460, y, size: 9, font, color: green });
      y -= 16;
    }

    // Grand total
    page.drawRectangle({ x: 340, y: y - 2, width: 215, height: 1.5, color: primary });
    y -= 20;
    page.drawText("TOTAL", { x: 350, y, size: 12, font: fontBold, color: primary });
    const grandTotal = totalPrice - promoDiscount - tierDiscount;
    page.drawText(`Rp ${grandTotal.toLocaleString("id-ID")}`, { x: 440, y, size: 12, font: fontBold, color: primary });

    // Footer
    y = 60;
    page.drawRectangle({ x: 0, y: 0, width: 595, height: 80, color: rgb(0.97, 0.97, 0.97) });
    page.drawText("Terima kasih telah menggunakan layanan ETNYX", { x: 160, y: 50, size: 10, font, color: gray });
    page.drawText(`Pertanyaan? Hubungi via WhatsApp: ${WHATSAPP_NUMBER}`, { x: 155, y: 32, size: 9, font, color: gray });

    const pdfBytes = await pdfDoc.save();
    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="invoice-${order.order_id}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Invoice generation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
