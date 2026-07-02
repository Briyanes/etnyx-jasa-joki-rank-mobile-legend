"use client";

import { useState, useRef, useEffect } from "react";
import { Languages, ChevronDown, Check } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Locale, localeNames } from "@/lib/i18n";

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (newLocale: Locale) => {
    setLocale(newLocale);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface border border-white/10 text-text text-sm hover:bg-white/5 transition-colors"
      >
        <Languages className="w-4 h-4 text-accent" />
        <span className="hidden sm:inline">{locale.toUpperCase()}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-surface border border-white/10 rounded-xl shadow-lg overflow-hidden z-50">
          {(Object.keys(localeNames) as Locale[]).map((loc) => (
            <button
              key={loc}
              onClick={() => handleSelect(loc)}
              className={`w-full px-4 py-3 text-left text-sm hover:bg-white/5 transition-colors flex items-center gap-2 ${
                locale === loc ? "text-accent bg-accent/10" : "text-text"
              }`}
            >
              {localeNames[loc]}
              {locale === loc && (
                <Check className="w-4 h-4 ml-auto text-accent" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
