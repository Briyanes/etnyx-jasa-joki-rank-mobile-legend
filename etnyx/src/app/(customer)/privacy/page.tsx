"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function PrivacyPage() {
  const { locale } = useLanguage();
  const t = locale === "id" ? privacyId : privacyEn;

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
        </div>
      </main>
      <Footer />
    </>
  );
}

const privacyId = {
  title: "Kebijakan Privasi",
  lastUpdated: "Terakhir diperbarui: 1 April 2026",
  sections: [
    {
      heading: "1. Informasi yang Kami Kumpulkan",
      paragraphs: [
        "Kami mengumpulkan informasi yang Anda berikan saat menggunakan layanan kami, termasuk: nama, email, nomor WhatsApp, dan informasi login game (terenkripsi).",
        "Kami juga mengumpulkan data teknis secara otomatis seperti alamat IP, jenis browser, dan halaman yang dikunjungi untuk meningkatkan layanan.",
      ],
    },
    {
      heading: "2. Penggunaan Informasi",
      paragraphs: [
        "Informasi Anda digunakan untuk: memproses order, mengirim notifikasi status order, memberikan dukungan pelanggan, dan meningkatkan layanan kami.",
        "Kami tidak menjual, menyewakan, atau membagikan informasi pribadi Anda kepada pihak ketiga untuk tujuan pemasaran.",
      ],
    },
    {
      heading: "3. Keamanan Data",
      paragraphs: [
        "Data login game Anda dienkripsi menggunakan standar enkripsi tinggi dan disimpan secara aman. Data login akan dihapus setelah order selesai.",
        "Kami menggunakan HTTPS untuk semua komunikasi dan menyimpan data di server yang aman dengan akses terbatas.",
      ],
    },
    {
      heading: "4. Cookie dan Tracking",
      paragraphs: [
        "Website kami menggunakan cookie untuk menyimpan preferensi pengguna dan meningkatkan pengalaman browsing.",
        "Kami menggunakan layanan analitik pihak ketiga (Google Analytics, Meta Pixel) untuk memahami penggunaan website. Data ini bersifat anonim.",
      ],
    },
    {
      heading: "5. Hak Pengguna",
      paragraphs: [
        "Anda berhak untuk: mengakses data pribadi Anda, meminta perbaikan data yang tidak akurat, meminta penghapusan data Anda, dan menarik persetujuan kapan saja.",
        "Untuk menggunakan hak-hak tersebut, hubungi kami melalui WhatsApp atau email.",
      ],
    },
    {
      heading: "6. Penyimpanan Data",
      paragraphs: [
        "Data order disimpan untuk keperluan riwayat dan dukungan pelanggan. Data login game dihapus segera setelah order selesai.",
        "Anda dapat meminta penghapusan seluruh data Anda kapan saja dengan menghubungi tim support.",
      ],
    },
    {
      heading: "7. Perubahan Kebijakan",
      paragraphs: [
        "Kami dapat memperbarui kebijakan privasi ini sewaktu-waktu. Perubahan akan dipublikasikan di halaman ini.",
      ],
    },
  ],
};

const privacyEn = {
  title: "Privacy Policy",
  lastUpdated: "Last updated: April 1, 2026",
  sections: [
    {
      heading: "1. Information We Collect",
      paragraphs: [
        "We collect information you provide when using our services, including: name, email, WhatsApp number, and game login credentials (encrypted).",
        "We also automatically collect technical data such as IP address, browser type, and pages visited to improve our services.",
      ],
    },
    {
      heading: "2. Use of Information",
      paragraphs: [
        "Your information is used to: process orders, send order status notifications, provide customer support, and improve our services.",
        "We do not sell, rent, or share your personal information with third parties for marketing purposes.",
      ],
    },
    {
      heading: "3. Data Security",
      paragraphs: [
        "Your game login data is encrypted using high-standard encryption and stored securely. Login data is deleted after the order is completed.",
        "We use HTTPS for all communications and store data on secure servers with restricted access.",
      ],
    },
    {
      heading: "4. Cookies and Tracking",
      paragraphs: [
        "Our website uses cookies to store user preferences and enhance the browsing experience.",
        "We use third-party analytics services (Google Analytics, Meta Pixel) to understand website usage. This data is anonymous.",
      ],
    },
    {
      heading: "5. User Rights",
      paragraphs: [
        "You have the right to: access your personal data, request correction of inaccurate data, request deletion of your data, and withdraw consent at any time.",
        "To exercise these rights, contact us via WhatsApp or email.",
      ],
    },
    {
      heading: "6. Data Retention",
      paragraphs: [
        "Order data is retained for history and customer support purposes. Game login data is deleted immediately after the order is completed.",
        "You can request the deletion of all your data at any time by contacting our support team.",
      ],
    },
    {
      heading: "7. Policy Changes",
      paragraphs: [
        "We may update this privacy policy from time to time. Changes will be published on this page.",
      ],
    },
  ],
};
