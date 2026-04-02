"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Locale, getTranslations, defaultLocale, Translations } from "@/lib/i18n";

interface LanguageContextType {
  locale: Locale;
  t: Translations;
  setLocale: (locale: Locale) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);
  const [t, setT] = useState<Translations>(getTranslations(defaultLocale));

  useEffect(() => {
    // Load saved locale from localStorage
    const savedLocale = localStorage.getItem("locale") as Locale | null;
    if (savedLocale && (savedLocale === "id" || savedLocale === "en")) {
      setLocaleState(savedLocale);
      setT(getTranslations(savedLocale));
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    setT(getTranslations(newLocale));
    localStorage.setItem("locale", newLocale);
  };

  return (
    <LanguageContext.Provider value={{ locale, t, setLocale }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
