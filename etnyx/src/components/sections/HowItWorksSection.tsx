"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { Calculator, CreditCard, Gamepad2, CheckCircle, ListOrdered } from "lucide-react";
import { ReactNode } from "react";

const icons: ReactNode[] = [
  <Calculator key="calc" className="w-7 h-7" />,
  <CreditCard key="card" className="w-7 h-7" />,
  <Gamepad2 key="game" className="w-7 h-7" />,
  <CheckCircle key="check" className="w-7 h-7" />,
];

const stepsId = [
  { step: 1, title: "Hitung Harga" },
  { step: 2, title: "Bayar 50%" },
  { step: 3, title: "Booster Kerja" },
  { step: 4, title: "Selesai!" },
];

const stepsEn = [
  { step: 1, title: "Calculate Price" },
  { step: 2, title: "Pay 50%" },
  { step: 3, title: "Booster Works" },
  { step: 4, title: "Done!" },
];

export default function HowItWorksSection() {
  const { locale } = useLanguage();
  
  const howItWorksSteps = locale === "id" ? stepsId : stepsEn;
  const t = {
    id: { badge: "CARA ORDER", title: "Cara", titleHighlight: "Order", subtitle: "Proses mudah dalam 4 langkah" },
    en: { badge: "HOW TO ORDER", title: "How to", titleHighlight: "Order", subtitle: "Easy process in 4 steps" },
  };
  const txt = t[locale];

  return (
    <section id="how-it-works" className="relative py-10 lg:py-14 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent/3 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto">
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-3 py-1 mb-3">
            <ListOrdered className="w-3.5 h-3.5 text-accent" />
            <span className="text-accent text-[10px] sm:text-xs font-semibold uppercase tracking-widest">{txt.badge}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-text mb-2">
            {txt.title} <span className="text-accent">{txt.titleHighlight}</span>
          </h2>
          <p className="text-text-muted text-sm sm:text-base">{txt.subtitle}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
          {howItWorksSteps.map((item, index) => (
            <div key={index} className="bg-white/[0.03] rounded-2xl p-4 md:p-6 text-center border border-white/5 hover:border-accent/20 hover:bg-white/[0.05] transition-all duration-300 group">
              <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 md:mb-4 transition-transform group-hover:scale-110 ${index === howItWorksSteps.length - 1 ? "bg-accent/20 text-accent" : "bg-accent/10 text-accent"}`}>
                {icons[index]}
              </div>
              <div className="text-xs font-semibold mb-2 text-accent uppercase tracking-wider">
                STEP {item.step}
              </div>
              <p className="font-semibold text-text text-sm">{item.title}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
