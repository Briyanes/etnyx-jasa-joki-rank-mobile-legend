"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { ArrowLeft, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

function FAQItem({ question, answer, id }: { question: string; answer: string; id: string }) {
  const [open, setOpen] = useState(false);
  const panelId = `faq-panel-${id}`;
  return (
    <div className="border border-white/10 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls={panelId}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/5 transition-colors"
      >
        <span className="text-text font-medium text-sm pr-4">{question}</span>
        <ChevronDown className={`w-4 h-4 text-text-muted flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div id={panelId} role="region" className="px-5 pb-4 text-text-muted text-sm leading-relaxed">
          {answer}
        </div>
      )}
    </div>
  );
}

export default function FAQPage() {
  const { locale } = useLanguage();
  const t = locale === "id" ? faqId : faqEn;

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
          <p className="text-text-muted text-sm mb-8">{t.subtitle}</p>

          <div className="space-y-3">
            {t.items.map((item, i) => (
              <FAQItem key={i} id={String(i)} question={item.q} answer={item.a} />
            ))}
          </div>

          <div className="mt-12 p-6 bg-surface rounded-2xl border border-white/5 text-center">
            <p className="text-text font-semibold mb-2">{t.stillHaveQuestions}</p>
            <p className="text-text-muted text-sm mb-4">{t.contactUs}</p>
            <a
              href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "6281515141540"}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 gradient-primary rounded-xl text-white font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              {t.whatsappButton}
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

const faqId = {
  title: "Pertanyaan yang Sering Diajukan (FAQ)",
  subtitle: "Temukan jawaban untuk pertanyaan umum seputar layanan ETNYX.",
  stillHaveQuestions: "Masih ada pertanyaan?",
  contactUs: "Hubungi kami langsung melalui WhatsApp untuk bantuan lebih lanjut.",
  whatsappButton: "Hubungi via WhatsApp",
  items: [
    {
      q: "Apa itu ETNYX?",
      a: "ETNYX adalah layanan jasa joki rank Mobile Legends profesional. Kami membantu menaikkan rank akun kamu dengan booster berpengalaman, aman, dan terpercaya.",
    },
    {
      q: "Apakah akun saya aman?",
      a: "Ya, keamanan akun adalah prioritas utama kami. Semua data login dienkripsi menggunakan AES-256-GCM dan hanya diakses oleh booster yang ditugaskan. Kami sarankan ganti password setelah order selesai.",
    },
    {
      q: "Bagaimana cara membuat order?",
      a: "Pilih mode joki (Paket, Per Bintang, atau Gendong), isi data akun, pilih metode pembayaran, lalu klik Bayar Sekarang. Kamu akan mendapat Order ID untuk tracking.",
    },
    {
      q: "Apa perbedaan Joki Paket, Per Bintang, dan Gendong?",
      a: "Joki Paket: booster login ke akunmu dan push rank sesuai paket. Per Bintang: bayar per bintang, fleksibel. Gendong: main bareng booster tanpa share akun, kamu tetap bermain.",
    },
    {
      q: "Metode pembayaran apa saja yang tersedia?",
      a: "Kami menerima pembayaran via Transfer Bank (BCA, BRI, BNI, Mandiri, Jago), E-Wallet, QRIS, dan pembayaran otomatis melalui iPaymu (Virtual Account, GoPay, ShopeePay, Kartu Kredit).",
    },
    {
      q: "Berapa lama proses pengerjaan?",
      a: "Waktu pengerjaan tergantung paket dan rank yang dipilih. Umumnya 1-7 hari kerja. Pilih opsi Express untuk pengerjaan lebih cepat dengan prioritas utama.",
    },
    {
      q: "Bagaimana cara melacak progress order?",
      a: "Gunakan fitur Track Order di website kami. Masukkan Order ID yang kamu terima saat membuat order untuk melihat progress real-time.",
    },
    {
      q: "Apakah ada garansi?",
      a: "Ya, kami memberikan garansi pengerjaan sesuai paket yang dipilih. Jika ada kendala, silakan hubungi kami melalui WhatsApp.",
    },
    {
      q: "Bagaimana jika saya ingin membatalkan order?",
      a: "Order yang belum dikerjakan dapat dibatalkan dengan menghubungi customer service kami. Kebijakan pengembalian dana mengikuti ketentuan di halaman Refund Policy.",
    },
    {
      q: "Apakah ada sistem referral atau diskon?",
      a: "Ya! Kamu bisa mendapatkan kode referral setelah mendaftar akun. Bagikan kode tersebut ke teman dan dapatkan reward points yang bisa ditukar diskon di order berikutnya.",
    },
    {
      q: "Apakah pembayaran saya aman?",
      a: "Ya, pembayaran otomatis diproses melalui iPaymu, payment gateway resmi yang terdaftar di Bank Indonesia. Data pembayaran tidak disimpan di server kami.",
    },
    {
      q: "Bagaimana cara menghubungi customer service?",
      a: "Kamu bisa menghubungi kami melalui WhatsApp, live chat di website, atau melalui email. Tim kami siap membantu 24/7.",
    },
  ],
};

const faqEn = {
  title: "Frequently Asked Questions (FAQ)",
  subtitle: "Find answers to common questions about ETNYX services.",
  stillHaveQuestions: "Still have questions?",
  contactUs: "Contact us directly via WhatsApp for further assistance.",
  whatsappButton: "Contact via WhatsApp",
  items: [
    {
      q: "What is ETNYX?",
      a: "ETNYX is a professional Mobile Legends rank boosting service. We help push your account rank with experienced, safe, and trusted boosters.",
    },
    {
      q: "Is my account safe?",
      a: "Yes, account security is our top priority. All login data is encrypted using AES-256-GCM and only accessed by the assigned booster. We recommend changing your password after the order is completed.",
    },
    {
      q: "How do I create an order?",
      a: "Choose a boosting mode (Package, Per Star, or Duo Boost), fill in your account data, select a payment method, then click Pay Now. You'll receive an Order ID for tracking.",
    },
    {
      q: "What's the difference between Package, Per Star, and Duo Boost?",
      a: "Package: booster logs into your account and pushes rank per package. Per Star: pay per star, flexible. Duo Boost: play together with a booster without sharing your account.",
    },
    {
      q: "What payment methods are available?",
      a: "We accept payment via Bank Transfer (BCA, BRI, BNI, Mandiri, Jago), E-Wallet, QRIS, and automatic payment through iPaymu (Virtual Account, GoPay, ShopeePay, Credit Card).",
    },
    {
      q: "How long does the process take?",
      a: "Processing time depends on the package and rank selected. Generally 1-7 business days. Choose the Express option for faster processing with top priority.",
    },
    {
      q: "How do I track my order progress?",
      a: "Use the Track Order feature on our website. Enter the Order ID you received when creating your order to see real-time progress.",
    },
    {
      q: "Is there a guarantee?",
      a: "Yes, we provide a completion guarantee according to the selected package. If there are any issues, please contact us via WhatsApp.",
    },
    {
      q: "What if I want to cancel my order?",
      a: "Orders that haven't been started can be cancelled by contacting our customer service. Refund policy follows the terms on our Refund Policy page.",
    },
    {
      q: "Is there a referral system or discounts?",
      a: "Yes! You can get a referral code after creating an account. Share it with friends and earn reward points redeemable for discounts on your next order.",
    },
    {
      q: "Is my payment secure?",
      a: "Yes, automatic payments are processed through iPaymu, an official payment gateway registered with Bank Indonesia. Payment data is not stored on our servers.",
    },
    {
      q: "How do I contact customer service?",
      a: "You can reach us via WhatsApp, live chat on our website, or email. Our team is ready to help 24/7.",
    },
  ],
};
