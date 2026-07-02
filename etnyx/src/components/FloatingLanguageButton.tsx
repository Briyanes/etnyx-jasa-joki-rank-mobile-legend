"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function FloatingLanguageButton() {
  const { locale, setLocale } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const toggle = () => {
    setLocale(locale === "id" ? "en" : "id");
  };

  return (
    <button
      onClick={toggle}
      className="fixed bottom-24 left-4 md:hidden z-50 w-10 h-10 rounded-full bg-surface border-2 border-white/20 flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all duration-200 overflow-hidden"
      aria-label={locale === "id" ? "Switch to English" : "Ganti ke Bahasa Indonesia"}
      title={locale === "id" ? "Switch to English" : "Ganti ke Bahasa Indonesia"}
    >
      <span className="text-xl leading-none" key={locale}>
        {locale === "id" ? "🇮🇩" : "🇬🇧"}
      </span>
    </button>
  );
}