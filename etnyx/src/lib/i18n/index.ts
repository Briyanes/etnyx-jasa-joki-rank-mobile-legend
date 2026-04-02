import { id, Translations } from "./id";
import { en } from "./en";

export type Locale = "id" | "en";

export const translations: Record<Locale, Translations> = {
  id,
  en,
};

export const defaultLocale: Locale = "id";

export const localeNames: Record<Locale, string> = {
  id: "🇮🇩 Indonesia",
  en: "🇺🇸 English",
};

export function getTranslations(locale: Locale): Translations {
  return translations[locale] || translations[defaultLocale];
}

export type { Translations };
