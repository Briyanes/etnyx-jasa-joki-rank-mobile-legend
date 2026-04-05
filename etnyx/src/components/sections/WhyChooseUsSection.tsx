"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { Zap, Shield, Coins, BarChart3, Gamepad2, MessageCircle, Gift } from "lucide-react";
import { ReactNode } from "react";
import CardCarousel from "@/components/CardCarousel";

const iconMap: Record<string, ReactNode> = {
  zap: <Zap className="w-7 h-7" />,
  shield: <Shield className="w-7 h-7" />,
  coins: <Coins className="w-7 h-7" />,
  chart: <BarChart3 className="w-7 h-7" />,
  gamepad: <Gamepad2 className="w-7 h-7" />,
  message: <MessageCircle className="w-7 h-7" />,
  gift: <Gift className="w-7 h-7" />,
};

export default function WhyChooseUsSection() {
  const { locale } = useLanguage();

  const features = [
    { icon: "zap", titleId: "Proses Kilat", titleEn: "Lightning Fast", descId: "Order langsung diproses dalam 5 menit. Tim booster stand-by 24/7 siap push rank Anda.", descEn: "Orders processed instantly within 5 minutes. Booster team on stand-by 24/7." },
    { icon: "shield", titleId: "Aman & Terpercaya", titleEn: "Safe & Trusted", descId: "Metode boosting aman tanpa cheat. Kami jaga akun kamu selama proses pengerjaan.", descEn: "Safe boosting methods without cheats. We keep your account secure during the process." },
    { icon: "coins", titleId: "Harga Bersaing", titleEn: "Fair Price", descId: "Harga wajar untuk kualitas kerja yang bagus. Ada promo untuk pelanggan setia.", descEn: "Fair prices for quality work. Promos available for loyal customers." },
    { icon: "chart", titleId: "Live Tracking", titleEn: "Live Tracking", descId: "Pantau progress push rank real-time. Update status setiap match selesai.", descEn: "Monitor rank push progress real-time. Status updates after every match." },
    { icon: "gamepad", titleId: "Booster Berpengalaman", titleEn: "Experienced Boosters", descId: "Tim booster rank Mythical Glory. Sudah terbiasa handle berbagai tier.", descEn: "Mythical Glory boosters. Experienced handling various tiers." },
    { icon: "message", titleId: "Support 24/7", titleEn: "24/7 Support", descId: "Tim support siap membantu kapan saja via WhatsApp. Respons < 5 menit.", descEn: "Support team ready to help anytime via WhatsApp. Response < 5 minutes." },
    { icon: "gift", titleId: "Member Rewards", titleEn: "Member Rewards", descId: "Kumpulkan poin setiap order dan naik tier Bronze → Platinum. Tukar poin dengan skin, diamond, atau diskon hingga 8%.", descEn: "Earn points on every order and level up from Bronze → Platinum. Redeem points for skins, diamonds, or up to 8% discount." },
  ];

  const t = {
    id: { badge: "MENGAPA ETNYX?", title: "Keunggulan", titleHighlight: "Layanan", titleEnd: "Kami", subtitle: "Yang bikin beda dari jasa joki lain" },
    en: { badge: "WHY ETNYX?", title: "Our", titleHighlight: "Service", titleEnd: "Advantages", subtitle: "What makes us different from other boosting services" },
  };

  const txt = t[locale];

  return (
    <section id="why-us" className="py-10 lg:py-14 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent/3 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/3 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-3 py-1 mb-3">
            <span className="text-accent text-[10px] sm:text-xs font-semibold uppercase tracking-widest">{txt.badge}</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-text mb-2">
            {txt.title} <span className="text-accent">{txt.titleHighlight}</span> {txt.titleEnd}
          </h2>
          <p className="text-text-muted max-w-2xl mx-auto text-sm sm:text-base">{txt.subtitle}</p>
        </div>

        <CardCarousel desktopCols={3} tabletCols={2}>
          {features.map((feature, index) => (
            <div key={index} className="group bg-white/[0.03] rounded-xl p-4 sm:p-5 border border-white/5 hover:border-accent/20 hover:bg-white/[0.05] transition-all duration-300 hover:-translate-y-1 h-full">
              <div className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center text-accent mb-3 group-hover:scale-110 transition-transform">
                {iconMap[feature.icon]}
              </div>
              <h3 className="text-base font-bold text-text mb-1 group-hover:text-accent transition-colors">
                {locale === "id" ? feature.titleId : feature.titleEn}
              </h3>
              <p className="text-text-muted text-sm leading-relaxed">
                {locale === "id" ? feature.descId : feature.descEn}
              </p>
            </div>
          ))}
        </CardCarousel>
      </div>
    </section>
  );
}
