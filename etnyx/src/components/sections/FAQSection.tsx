"use client";

import { useState, useCallback, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { ChevronDown, HelpCircle } from "lucide-react";

const faqItemsId = [
  {
    question: "Apakah akun saya aman?",
    answer: "100% aman. Kami menggunakan VPN Indonesia dan tidak mengakses data pribadi apapun selain bermain ranked. Lebih dari 3000 order sukses tanpa ada banned.",
  },
  {
    question: "Berapa lama proses joki?",
    answer: "Tergantung paket yang dipilih. Paket Express biasanya 1-3 hari, paket reguler 3-7 hari untuk naik 1 tier. Progress bisa dipantau real-time.",
  },
  {
    question: "Bagaimana cara pembayaran?",
    answer: "Kami menerima transfer bank (BCA, Mandiri, BNI, BRI), e-wallet (OVO, GoPay, DANA), dan QRIS. Pembayaran 50% di awal, 50% setelah selesai.",
  },
  {
    question: "Apakah bisa request hero tertentu?",
    answer: "Bisa! Dengan paket Premium, kamu bisa request hero favorit. Booster kami menguasai berbagai hero meta dan off-meta.",
  },
  {
    question: "Bagaimana jika terjadi masalah?",
    answer: "Tim support kami tersedia 24/7 via WhatsApp. Kami juga memberikan garansi jika target tidak tercapai.",
  },
  {
    question: "Apakah ada garansi jika kalah?",
    answer: "Ada! Jika booster kami kalah dan rank turun, kami akan mengembalikan ke rank semula tanpa biaya tambahan. Garansi berlaku selama proses pengerjaan.",
  },
  {
    question: "Apakah saya bisa main saat proses joki?",
    answer: "Tidak disarankan. Selama proses joki berlangsung, hindari login ke akun agar tidak mengganggu proses dan menjaga keamanan akun.",
  },
  {
    question: "Bagaimana cara melacak progress joki?",
    answer: "Setelah order, kamu akan mendapat link tracking real-time. Bisa juga pantau langsung via WhatsApp dengan tim support kami.",
  },
  {
    question: "Apakah data login saya tersimpan?",
    answer: "Tidak. Setelah order selesai, semua data login kamu akan langsung dihapus dari sistem kami. Kami sangat menjaga privasi pelanggan.",
  },
  {
    question: "Bisa joki dari rank berapa saja?",
    answer: "Bisa dari rank Warrior sampai Mythical Glory. Setiap tier memiliki booster khusus yang berpengalaman di level tersebut.",
  },
];

const faqItemsEn = [
  {
    question: "Is my account safe?",
    answer: "100% safe. We use Indonesian VPN and don't access any personal data except playing ranked games. Over 3000 successful orders without any bans.",
  },
  {
    question: "How long does boosting take?",
    answer: "Depends on the package. Express packages usually take 1-3 days, regular packages 3-7 days to climb 1 tier. Progress can be tracked in real-time.",
  },
  {
    question: "What are the payment options?",
    answer: "We accept bank transfers (BCA, Mandiri, BNI, BRI), e-wallets (OVO, GoPay, DANA), and QRIS. Payment is 50% upfront, 50% after completion.",
  },
  {
    question: "Can I request specific heroes?",
    answer: "Yes! With Premium package, you can request your favorite heroes. Our boosters master various meta and off-meta heroes.",
  },
  {
    question: "What if there's a problem?",
    answer: "Our support team is available 24/7 via WhatsApp. We also provide a guarantee if the target is not reached.",
  },
  {
    question: "Is there a guarantee if I lose rank?",
    answer: "Yes! If our booster loses and your rank drops, we'll restore it to the original rank at no extra cost. Guarantee applies during the boosting process.",
  },
  {
    question: "Can I play during the boosting process?",
    answer: "It's not recommended. During boosting, please avoid logging into your account to prevent disruption and maintain account security.",
  },
  {
    question: "How do I track my boosting progress?",
    answer: "After ordering, you'll receive a real-time tracking link. You can also monitor directly via WhatsApp with our support team.",
  },
  {
    question: "Is my login data stored?",
    answer: "No. After the order is completed, all your login data is immediately deleted from our system. We take customer privacy very seriously.",
  },
  {
    question: "Can you boost from any rank?",
    answer: "Yes, from Warrior to Mythical Glory. Each tier has specialized boosters experienced at that level.",
  },
];

export default function FAQSection() {
  const { locale } = useLanguage();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [cmsFaqItems, setCmsFaqItems] = useState<{ question: string; answer: string }[] | null>(null);

  useEffect(() => {
    fetch("/api/settings?keys=faq_items")
      .then((res) => res.json())
      .then((data) => { if (data.faq_items && Array.isArray(data.faq_items)) setCmsFaqItems(data.faq_items); })
      .catch(() => {});
  }, []);

  const faqItems = cmsFaqItems || (locale === "id" ? faqItemsId : faqItemsEn);

  const t = {
    id: { title: "FAQ", subtitle: "Pertanyaan yang sering ditanyakan" },
    en: { title: "FAQ", subtitle: "Frequently asked questions" },
  };

  const txt = t[locale];

  const toggleFaq = useCallback((index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  }, []);

  return (
    <section id="faq" className="relative py-10 lg:py-14 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-accent/3 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-3 py-1 mb-3">
            <HelpCircle className="w-3.5 h-3.5 text-accent" />
            <span className="text-accent text-[10px] sm:text-xs font-semibold uppercase tracking-widest">FAQ</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-text mb-2">
            {txt.title}
          </h2>
          <p className="text-text-muted text-sm sm:text-base max-w-lg mx-auto">
            {txt.subtitle}
          </p>
        </div>

        {/* FAQ Items — 2 columns on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {faqItems.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className={`group rounded-xl border transition-all duration-300 ${
                  isOpen
                    ? "bg-white/[0.06] border-accent/30 shadow-[0_0_20px_rgba(var(--color-accent-rgb,0,255,200),0.05)]"
                    : "bg-white/[0.03] border-white/5 hover:border-white/10 hover:bg-white/[0.05]"
                }`}
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full px-4 py-3 text-left flex items-center justify-between gap-3"
                  aria-expanded={isOpen}
                >
                  <span className={`font-medium text-sm sm:text-base transition-colors duration-200 ${isOpen ? "text-accent" : "text-text"}`}>
                    {item.question}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 flex-shrink-0 text-accent/60 transition-transform duration-300 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    isOpen ? "max-h-96" : "max-h-0"
                  }`}
                >
                  <div className="px-4 pb-3 pt-0">
                    <div className="h-px w-full bg-gradient-to-r from-accent/20 via-accent/10 to-transparent mb-3" />
                    <p className="text-text-muted text-sm leading-relaxed">
                      {item.answer}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
