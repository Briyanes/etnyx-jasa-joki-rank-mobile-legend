"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { ShieldCheck, Zap, Crown, MessageCircle } from "lucide-react";
import { ReactNode } from "react";

type TrustItem = {
  icon: ReactNode;
  title: string;
  description: string;
};

const iconClass = "w-8 h-8";

const trustItemsId: TrustItem[] = [
  { icon: <ShieldCheck className={iconClass} />, title: "100% Aman", description: "Akun dijamin tidak banned" },
  { icon: <Zap className={iconClass} />, title: "Proses Cepat", description: "Selesai tepat waktu" },
  { icon: <Crown className={iconClass} />, title: "Booster Pro", description: "Tim berpengalaman" },
  { icon: <MessageCircle className={iconClass} />, title: "Support 24/7", description: "CS siap membantu" },
];

const trustItemsEn: TrustItem[] = [
  { icon: <ShieldCheck className={iconClass} />, title: "100% Safe", description: "Account guaranteed no ban" },
  { icon: <Zap className={iconClass} />, title: "Fast Process", description: "Completed on time" },
  { icon: <Crown className={iconClass} />, title: "Pro Boosters", description: "Experienced team" },
  { icon: <MessageCircle className={iconClass} />, title: "24/7 Support", description: "CS ready to help" },
];

export default function TrustSection() {
  const { locale } = useLanguage();
  
  const trustItems = locale === "id" ? trustItemsId : trustItemsEn;
  const title = locale === "id" ? "Kenapa Pilih" : "Why Choose";
  const titleHighlight = locale === "id" ? "Kami?" : "Us?";

  return (
    <section className="relative py-10 lg:py-14 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-accent/3 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-3 py-1 mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-accent" />
            <span className="text-accent text-[10px] sm:text-xs font-semibold uppercase tracking-widest">
              {locale === "id" ? "DIPERCAYA" : "TRUSTED"}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-text mb-2">
            {title} <span className="text-accent">{titleHighlight}</span>
          </h2>
        </div>

        {/* Trust Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
          {trustItems.map((item, index) => (
            <div
              key={index}
              className="bg-white/[0.03] rounded-2xl p-4 md:p-6 text-center border border-white/5 hover:border-accent/20 hover:bg-white/[0.05] transition-all duration-300 hover:-translate-y-1 group"
            >
              {/* Icon */}
              <div className="text-accent mb-3 transition-transform group-hover:scale-110 flex justify-center">
                {item.icon}
              </div>

              {/* Title */}
              <p className="font-bold text-text mb-1">{item.title}</p>

              {/* Description */}
              <p className="text-sm text-text-muted">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
