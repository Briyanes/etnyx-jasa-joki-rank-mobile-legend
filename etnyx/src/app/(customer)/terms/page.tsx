"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function TermsPage() {
  const { locale } = useLanguage();
  const t = locale === "id" ? termsId : termsEn;

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

const termsId = {
  title: "Syarat & Ketentuan",
  lastUpdated: "Terakhir diperbarui: 1 April 2026",
  sections: [
    {
      heading: "1. Ketentuan Umum",
      paragraphs: [
        "Dengan menggunakan layanan ETNYX, Anda menyetujui syarat dan ketentuan yang berlaku. Layanan kami meliputi jasa joki rank Mobile Legends: Bang Bang.",
        "ETNYX berhak mengubah syarat dan ketentuan ini kapan saja tanpa pemberitahuan terlebih dahulu. Perubahan berlaku sejak dipublikasikan di website.",
      ],
    },
    {
      heading: "2. Layanan",
      paragraphs: [
        "Kami menyediakan layanan push rank (joki) untuk game Mobile Legends: Bang Bang. Layanan mencakup paket rank, per-star, dan gendong (duo boost).",
        "Durasi pengerjaan bervariasi tergantung paket yang dipilih dan kondisi server game. Estimasi waktu yang diberikan bersifat perkiraan.",
        "Kami tidak bertanggung jawab atas gangguan yang disebabkan oleh maintenance server game atau perubahan kebijakan dari pihak Moonton.",
      ],
    },
    {
      heading: "3. Akun dan Keamanan",
      paragraphs: [
        "Anda wajib memberikan informasi login yang benar. Semua data login dienkripsi dan akan dihapus setelah order selesai.",
        "Selama proses pengerjaan, jangan login ke akun game Anda untuk menghindari gangguan dan menjaga keamanan.",
        "Kami menggunakan VPN Indonesia dan metode aman untuk meminimalkan risiko. Namun, kami tidak dapat menjamin 100% bahwa tidak ada risiko dari pihak ketiga (Moonton).",
      ],
    },
    {
      heading: "4. Pembayaran",
      paragraphs: [
        "Pembayaran dilakukan melalui metode yang tersedia di website (transfer bank, e-wallet, QRIS). Harga yang tertera sudah termasuk biaya layanan.",
        "Pembayaran bersifat final setelah order dikonfirmasi. Refund hanya diberikan jika target tidak tercapai sesuai ketentuan garansi.",
      ],
    },
    {
      heading: "5. Garansi",
      paragraphs: [
        "Jika booster kami mengalami kekalahan dan rank turun selama proses pengerjaan, kami akan mengembalikan ke rank semula tanpa biaya tambahan.",
        "Garansi tidak berlaku jika pelanggan login ke akun selama proses pengerjaan atau melakukan tindakan yang mengganggu proses joki.",
      ],
    },
    {
      heading: "6. Larangan",
      paragraphs: [
        "Pelanggan dilarang memberikan informasi akun palsu atau menyalahgunakan layanan kami.",
        "Pelanggan dilarang melakukan chargeback atau sengketa pembayaran tanpa menghubungi kami terlebih dahulu.",
      ],
    },
    {
      heading: "7. Kontak",
      paragraphs: [
        "Untuk pertanyaan atau keluhan, hubungi kami melalui WhatsApp atau email yang tertera di website.",
      ],
    },
  ],
};

const termsEn = {
  title: "Terms of Service",
  lastUpdated: "Last updated: April 1, 2026",
  sections: [
    {
      heading: "1. General Terms",
      paragraphs: [
        "By using ETNYX services, you agree to these terms and conditions. Our services include rank boosting (joki) for Mobile Legends: Bang Bang.",
        "ETNYX reserves the right to modify these terms at any time without prior notice. Changes take effect upon publication on the website.",
      ],
    },
    {
      heading: "2. Services",
      paragraphs: [
        "We provide rank boosting services for Mobile Legends: Bang Bang. Services include rank packages, per-star boosting, and duo boost (gendong).",
        "Processing time varies depending on the selected package and game server conditions. Estimated times are approximate.",
        "We are not responsible for disruptions caused by game server maintenance or policy changes by Moonton.",
      ],
    },
    {
      heading: "3. Account and Security",
      paragraphs: [
        "You must provide correct login information. All login data is encrypted and will be deleted after the order is completed.",
        "During the boosting process, do not log into your game account to avoid disruption and maintain security.",
        "We use Indonesian VPN and secure methods to minimize risk. However, we cannot guarantee 100% that there is no risk from third parties (Moonton).",
      ],
    },
    {
      heading: "4. Payment",
      paragraphs: [
        "Payment is made through methods available on the website (bank transfer, e-wallet, QRIS). Listed prices include service fees.",
        "Payment is final once the order is confirmed. Refunds are only given if the target is not reached per the guarantee terms.",
      ],
    },
    {
      heading: "5. Guarantee",
      paragraphs: [
        "If our booster loses and your rank drops during the process, we will restore it to the original rank at no extra cost.",
        "The guarantee does not apply if the customer logs into their account during the process or takes actions that interfere with the boosting.",
      ],
    },
    {
      heading: "6. Prohibited Actions",
      paragraphs: [
        "Customers are prohibited from providing false account information or misusing our services.",
        "Customers are prohibited from initiating chargebacks or payment disputes without contacting us first.",
      ],
    },
    {
      heading: "7. Contact",
      paragraphs: [
        "For questions or complaints, contact us via WhatsApp or email listed on the website.",
      ],
    },
  ],
};
