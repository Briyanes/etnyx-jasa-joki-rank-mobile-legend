import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { verifyAdmin } from "@/lib/admin-auth";

// GET - Generate invoice HTML/PDF for an order
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");
    const format = searchParams.get("format") || "html"; // html or pdf
    const verifyPhone = searchParams.get("phone");

    if (!orderId) {
      return NextResponse.json({ error: "orderId required" }, { status: 400 });
    }

    const supabase = await createAdminClient();

    // Auth: require admin token or phone verification
    const admin = await verifyAdmin();
    if (!admin.authenticated && !verifyPhone) {
      return NextResponse.json({ error: "Authentication required. Pass ?phone=<whatsapp> for verification." }, { status: 401 });
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

    // Verify phone ownership for non-admin requests
    if (!admin.authenticated && verifyPhone) {
      const orderWhatsapp = order.whatsapp || order.customers?.whatsapp || "";
      if (orderWhatsapp !== verifyPhone) {
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
      <div class="logo">🎮 ETNYX</div>
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
              <strong>Jasa Joki Mobile Legends</strong><br>
              <span style="color: #666; font-size: 13px;">Push Rank Service</span>
            </td>
            <td>
              ${order.current_rank || "Warrior"} → ${order.target_rank || "Mythic"}<br>
              <span style="color: #666; font-size: 13px;">
                ${order.is_express && order.is_premium ? '⚡👑 Express Premium' : order.is_express ? '⚡ Express' : order.is_premium ? '👑 Premium' : '🎯 Standard'}
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
        </tbody>
      </table>
      
      <div class="total-section">
        <div class="total-row">
          <span>Subtotal</span>
          <span>Rp ${(order.total_price || 0).toLocaleString("id-ID")}</span>
        </div>
        ${(order.promo_discount || 0) > 0 ? `
        <div class="total-row">
          <span>Diskon</span>
          <span style="color: #059669;">- Rp ${(order.promo_discount || 0).toLocaleString("id-ID")}</span>
        </div>
        ` : ''}
        <div class="total-row grand">
          <span>Total</span>
          <span>Rp ${((order.total_price || 0) - (order.promo_discount || 0)).toLocaleString("id-ID")}</span>
        </div>
      </div>
    </div>
    
    <div class="footer">
      <p>Terima kasih telah menggunakan layanan <strong>ETNYX</strong></p>
      <p>Pertanyaan? Hubungi kami di <a href="https://wa.me/6281414131321">WhatsApp</a></p>
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

    // For PDF, return HTML with print instruction
    // Client should use browser's print-to-PDF feature
    return new NextResponse(invoiceHtml.replace("</head>", `
  <script>
    window.onload = function() {
      window.print();
      window.onafterprint = function() {
        window.close();
      }
    }
  </script>
</head>`), {
      headers: {
        "Content-Type": "text/html",
      },
    });
  } catch (error) {
    console.error("Invoice generation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
