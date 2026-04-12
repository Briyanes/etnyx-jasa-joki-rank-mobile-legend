"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function RefundPolicyPage() {
  const { locale } = useLanguage();
  const t = locale === "id" ? refundId : refundEn;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-2 text-text-muted hover:text-accent text-sm mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            {locale === "id" ? "Kembali ke Beranda" : "Back to Home"}
          </Link>

          <h1 className="text-2xl sm:text-3xl font-bold text-text mb-2">{t.title}</h1>
          <p className="text-text-muted text-sm mb-8">{t.lastUpdated}</p>

          <div className="space-y-8">
            {t.sections.map((section, i) => (
              <div key={i}>
                <h2 className="text-lg font-semibold text-text mb-3">{section.heading}</h2>
                <div className="text-text-muted text-sm leading-relaxed space-y-2">
                  {section.paragraphs.map((p, j) => (
                    <p key={j}>{p}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Contact for Refund */}
          <div className="mt-12 bg-surface rounded-2xl border border-white/5 p-6">
            <h2 className="text-lg font-semibold text-text mb-3">
              {locale === "id" ? "Hubungi Kami untuk Refund" : "Contact Us for Refund"}
            </h2>
            <div className="text-text-muted text-sm space-y-2">
              <p>Email: <a href="mailto:support@etnyx.id" className="text-accent hover:underline">support@etnyx.id</a></p>
              <p>WhatsApp: <a href="https://wa.me/6281515141540" className="text-accent hover:underline">+62 815-1514-1540</a></p>
              <p>{locale === "id" ? "Jam operasional: Senin–Minggu, 08.00–23.00 WIB" : "Operating hours: Monday–Sunday, 08:00–23:00 WIB (GMT+7)"}</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

const refundId = {
  title: "Kebijakan Pengembalian Dana (Refund Policy)",
  lastUpdated: "Terakhir diperbarui: 9 April 2026",
  sections: [
    {
      heading: "1. Ketentuan Umum Refund",
      paragraphs: [
        "ETNYX berkomitmen memberikan layanan terbaik. Kebijakan pengembalian dana ini berlaku untuk semua transaksi yang dilakukan melalui website etnyx.com.",
        "Setiap permintaan refund akan diproses secara adil dan transparan sesuai ketentuan yang tertera di halaman ini.",
      ],
    },
    {
      heading: "2. Kondisi yang Memenuhi Syarat Refund",
      paragraphs: [
        "Refund penuh (100%) diberikan jika: (a) Order belum dikerjakan/diassign ke booster dan pelanggan membatalkan dalam waktu 1x24 jam setelah pembayaran; (b) Terjadi kesalahan teknis dari pihak ETNYX yang menyebabkan layanan tidak dapat diberikan.",
        "Refund sebagian diberikan jika: (a) Target rank tidak tercapai sepenuhnya karena kendala dari tim kami — refund proporsional berdasarkan sisa rank yang belum dikerjakan; (b) Terjadi keterlambatan pengerjaan melebihi estimasi waktu yang dijanjikan secara signifikan (lebih dari 2x estimasi).",
        "Garansi rank berlaku: Jika rank turun selama proses pengerjaan oleh booster kami, kami akan mengembalikan ke rank semula tanpa biaya tambahan. Ini bukan refund uang, melainkan garansi layanan.",
      ],
    },
    {
      heading: "3. Kondisi yang Tidak Memenuhi Syarat Refund",
      paragraphs: [
        "Refund tidak diberikan jika: (a) Pelanggan login ke akun game selama proses pengerjaan berlangsung; (b) Pelanggan memberikan informasi login yang salah atau mengubah password tanpa konfirmasi; (c) Order sudah selesai dan target rank tercapai; (d) Pembatalan setelah order sudah mulai dikerjakan oleh booster.",
        "Refund juga tidak berlaku untuk: (a) Gangguan dari pihak server game (maintenance Moonton); (b) Ban atau penalti akun yang disebabkan oleh riwayat pelanggan sendiri sebelum menggunakan layanan kami; (c) Ketidakpuasan terhadap durasi pengerjaan selama masih dalam estimasi yang wajar.",
      ],
    },
    {
      heading: "4. Proses Pengajuan Refund",
      paragraphs: [
        "Langkah 1: Hubungi tim support kami via WhatsApp atau email dengan menyertakan Order ID dan alasan refund.",
        "Langkah 2: Tim kami akan meninjau permintaan dalam waktu 1x24 jam kerja.",
        "Langkah 3: Jika disetujui, refund akan diproses dalam 3–7 hari kerja ke metode pembayaran asal (rekening bank atau e-wallet).",
        "Untuk pembayaran melalui iPaymu (VA, QRIS, E-Wallet), refund akan ditransfer ke rekening bank yang didaftarkan pelanggan.",
      ],
    },
    {
      heading: "5. Jumlah Refund",
      paragraphs: [
        "Refund penuh: 100% dari total pembayaran dikembalikan.",
        "Refund sebagian: Dihitung proporsional berdasarkan progres pekerjaan yang sudah diselesaikan. Contoh: jika target 5 tier dan baru selesai 2 tier, refund sebesar 60% (3/5 dari total).",
        "Biaya transaksi payment gateway (jika ada) tidak dapat dikembalikan karena merupakan biaya pihak ketiga.",
      ],
    },
    {
      heading: "6. Pembatalan Order",
      paragraphs: [
        "Pelanggan dapat membatalkan order yang belum dikerjakan dengan menghubungi admin. Refund penuh akan diberikan.",
        "Order yang sudah dalam proses pengerjaan hanya dapat dibatalkan dengan persetujuan admin. Refund akan dihitung proporsional.",
        "Pembatalan otomatis: Order yang belum dibayar dalam 24 jam akan otomatis dibatalkan oleh sistem.",
      ],
    },
    {
      heading: "7. Penyelesaian Sengketa",
      paragraphs: [
        "Jika terdapat ketidaksepuasan terhadap keputusan refund, pelanggan dapat mengajukan banding melalui email support@etnyx.id dengan menyertakan bukti pendukung.",
        "Keputusan akhir mengenai refund berada di tangan manajemen ETNYX setelah mempertimbangkan semua bukti dan fakta.",
        "Pelanggan dilarang melakukan chargeback melalui bank atau payment gateway tanpa menghubungi kami terlebih dahulu. Chargeback tanpa komunikasi akan dianggap sebagai pelanggaran dan akun akan diblokir.",
      ],
    },
  ],
};

const refundEn = {
  title: "Refund Policy",
  lastUpdated: "Last updated: April 9, 2026",
  sections: [
    {
      heading: "1. General Refund Terms",
      paragraphs: [
        "ETNYX is committed to providing the best service. This refund policy applies to all transactions made through etnyx.com.",
        "Every refund request will be processed fairly and transparently according to the terms stated on this page.",
      ],
    },
    {
      heading: "2. Conditions Eligible for Refund",
      paragraphs: [
        "Full refund (100%) will be given if: (a) The order has not been assigned to a booster and the customer cancels within 24 hours of payment; (b) A technical error from ETNYX prevents the service from being delivered.",
        "Partial refund will be given if: (a) The target rank is not fully achieved due to issues from our team — refund is proportional to remaining unfinished ranks; (b) Processing time significantly exceeds the estimated time (more than 2x the estimate).",
        "Rank guarantee applies: If your rank drops during boosting by our team, we will restore it to the original rank at no extra cost. This is a service guarantee, not a monetary refund.",
      ],
    },
    {
      heading: "3. Conditions Not Eligible for Refund",
      paragraphs: [
        "Refund will not be given if: (a) The customer logs into their game account during the boosting process; (b) The customer provides incorrect login information or changes the password without notification; (c) The order is completed and the target rank is achieved; (d) Cancellation after the order has been started by a booster.",
        "Refund also does not apply to: (a) Game server disruptions (Moonton maintenance); (b) Account bans or penalties caused by the customer's own history before using our service; (c) Dissatisfaction with processing time while still within reasonable estimates.",
      ],
    },
    {
      heading: "4. Refund Request Process",
      paragraphs: [
        "Step 1: Contact our support team via WhatsApp or email with your Order ID and reason for refund.",
        "Step 2: Our team will review the request within 1 business day.",
        "Step 3: If approved, the refund will be processed within 3–7 business days to the original payment method (bank account or e-wallet).",
        "For payments via iPaymu (VA, QRIS, E-Wallet), refunds will be transferred to the customer's registered bank account.",
      ],
    },
    {
      heading: "5. Refund Amount",
      paragraphs: [
        "Full refund: 100% of the total payment is returned.",
        "Partial refund: Calculated proportionally based on completed work progress. Example: if the target is 5 tiers and 2 are completed, refund is 60% (3/5 of total).",
        "Payment gateway transaction fees (if any) are non-refundable as they are third-party charges.",
      ],
    },
    {
      heading: "6. Order Cancellation",
      paragraphs: [
        "Customers can cancel unprocessed orders by contacting admin. A full refund will be given.",
        "Orders already in progress can only be cancelled with admin approval. Refund will be calculated proportionally.",
        "Auto-cancellation: Orders unpaid within 24 hours will be automatically cancelled by the system.",
      ],
    },
    {
      heading: "7. Dispute Resolution",
      paragraphs: [
        "If you are unsatisfied with a refund decision, you may file an appeal via email at support@etnyx.id with supporting evidence.",
        "Final refund decisions are made by ETNYX management after considering all evidence and facts.",
        "Customers are prohibited from initiating chargebacks through banks or payment gateways without contacting us first. Unauthorized chargebacks will be considered a violation and the account will be blocked.",
      ],
    },
  ],
};
