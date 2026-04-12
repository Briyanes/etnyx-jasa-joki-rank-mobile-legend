"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useLanguage } from "@/contexts/LanguageContext";
import { WHATSAPP_NUMBER } from "@/lib/constants";
import { 
  ShoppingCart, Search, MessageCircle,
  ExternalLink, Gift, User,
  MapPin, Clock, Star, Shield, Zap, BookOpen,
  HelpCircle, LogIn
} from "lucide-react";

const translations = {
  id: {
    subtitle: "Jasa Joki & Gendong Mobile Legends",
    online: "Online 24/7",
    orderTitle: "Order Joki",
    orderDesc: "Langsung order push rank",
    trackTitle: "Lacak Order",
    trackDesc: "Cek progress order kamu",
    chatTitle: "Chat WhatsApp",
    chatDesc: "Tanya langsung ke CS kami",
    rewardsTitle: "Dashboard & Rewards",
    rewardsDesc: "Kelola pesanan, poin & tukar hadiah",
    websiteTitle: "Website Utama",
    websiteDesc: "etnyx.com",
    reviewsTitle: "Lihat Review",
    reviewsDesc: "Baca review dari customer lain",
    writeReviewTitle: "Tulis Review",
    writeReviewDesc: "Berikan review & dapatkan skin gratis",
    faqTitle: "FAQ",
    faqDesc: "Pertanyaan yang sering ditanyakan",
    loginTitle: "Login / Daftar",
    loginDesc: "Masuk atau buat akun baru",
    followUs: "Follow Us",
    startFrom: "Mulai dari",
    rating: "Rating",
    safe: "Aman 100%",
    footer: "Jasa joki rank ML terpercaya #1 di Indonesia",
    terms: "Syarat & Ketentuan",
    privacy: "Kebijakan Privasi",
    refund: "Kebijakan Refund",
  },
  en: {
    subtitle: "Mobile Legends Boosting Service",
    online: "Online 24/7",
    orderTitle: "Order Boost",
    orderDesc: "Order rank push instantly",
    trackTitle: "Track Order",
    trackDesc: "Check your order progress",
    chatTitle: "Chat WhatsApp",
    chatDesc: "Ask our CS directly",
    rewardsTitle: "Dashboard & Rewards",
    rewardsDesc: "Manage orders, points & redeem prizes",
    websiteTitle: "Main Website",
    websiteDesc: "etnyx.com",
    reviewsTitle: "See Reviews",
    reviewsDesc: "Read reviews from other customers",
    writeReviewTitle: "Write Review",
    writeReviewDesc: "Leave a review & get a free skin",
    faqTitle: "FAQ",
    faqDesc: "Frequently asked questions",
    loginTitle: "Login / Register",
    loginDesc: "Sign in or create an account",
    followUs: "Follow Us",
    startFrom: "Start from",
    rating: "Rating",
    safe: "100% Safe",
    footer: "#1 Trusted ML rank boosting service in Indonesia",
    terms: "Terms of Service",
    privacy: "Privacy Policy",
    refund: "Refund Policy",
  },
};

const defaultSocials = [
  { href: "https://instagram.com/etnyx_ml", label: "Instagram", icon: InstagramIcon },
  { href: "https://tiktok.com/@etnyx_ml", label: "TikTok", icon: TikTokIcon },
  { href: "https://facebook.com/etnyx_ml", label: "Facebook", icon: FacebookIcon },
  { href: "https://youtube.com/@etnyx_ml", label: "YouTube", icon: YoutubeIcon },
];

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.43V13a8.16 8.16 0 005.58 2.2V11.7a4.85 4.85 0 01-3.55-1.45V6.69h3.55z" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

export default function BioPage() {
  const { locale, setLocale } = useLanguage();
  const t = translations[locale as keyof typeof translations] || translations.id;
  const [socials, setSocials] = useState(defaultSocials);

  useEffect(() => {
    fetch("/api/settings?keys=social_links")
      .then((r) => r.json())
      .then((d) => {
        if (d.social_links) {
          const sl = d.social_links;
          setSocials([
            { href: sl.instagram || "https://instagram.com/etnyx_ml", label: "Instagram", icon: InstagramIcon },
            { href: sl.tiktok || "https://tiktok.com/@etnyx_ml", label: "TikTok", icon: TikTokIcon },
            { href: sl.facebook || "https://facebook.com/etnyx_ml", label: "Facebook", icon: FacebookIcon },
            { href: sl.youtube || "https://youtube.com/@etnyx_ml", label: "YouTube", icon: YoutubeIcon },
          ]);
        }
      })
      .catch(() => {});
  }, []);

  const links = [
    { href: "/order", icon: ShoppingCart, title: t.orderTitle, desc: t.orderDesc, accent: true },
    { href: "/track", icon: Search, title: t.trackTitle, desc: t.trackDesc },
    {
      href: `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(locale === "id" ? "Halo kak, mau tanya soal joki ML" : "Hi, I want to ask about ML boosting")}`,
      icon: MessageCircle, title: t.chatTitle, desc: t.chatDesc, external: true,
    },
    { href: "/login", icon: LogIn, title: t.loginTitle, desc: t.loginDesc },
    { href: "/dashboard", icon: Gift, title: t.rewardsTitle, desc: t.rewardsDesc },
    { href: "/#testimonials", icon: Star, title: t.reviewsTitle, desc: t.reviewsDesc },
    { href: "/faq", icon: HelpCircle, title: t.faqTitle, desc: t.faqDesc },
    { href: "/", icon: ExternalLink, title: t.websiteTitle, desc: t.websiteDesc },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col items-center relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto px-4 py-10">
        {/* Language toggle */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setLocale(locale === "id" ? "en" : "id")}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-text text-xs hover:bg-white/10 transition-colors"
          >
            <span>{locale === "id" ? "🇮🇩" : "🇺🇸"}</span>
            <span className="font-medium">{locale.toUpperCase()}</span>
          </button>
        </div>

        {/* Profile Header */}
        <div className="text-center mb-6">
          <div className="relative inline-block mb-4">
            <div className="w-24 h-24 rounded-full border-2 border-accent/30 p-1 mx-auto">
              <Image
                src="/logo/logo-circle.webp"
                alt="ETNYX"
                width={96}
                height={96}
                className="w-full h-full rounded-full object-cover"
                priority
              />
            </div>
            {/* Online indicator */}
            <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background" />
          </div>

          <h1 className="text-xl font-bold text-text tracking-wide">ETNYX</h1>
          <p className="text-text-muted text-sm mt-1">{t.subtitle}</p>
          
          <div className="flex items-center justify-center gap-3 mt-3 text-text-muted text-xs">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-accent" />
              {t.online}
            </span>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-accent" />
              Indonesia
            </span>
          </div>
        </div>

        {/* Trust badges */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-[10px] font-semibold">
            <Zap className="w-3 h-3" />
            {t.startFrom} Rp 5K
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-[10px] font-semibold">
            <Star className="w-3 h-3" />
            {t.rating} 4.9/5
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-semibold">
            <Shield className="w-3 h-3" />
            {t.safe}
          </div>
        </div>

        {/* Links */}
        <div className="flex flex-col gap-3 mb-8">
          {links.map((link) => (
            <a
              key={link.title}
              href={link.href}
              {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className={`group relative flex items-center gap-4 rounded-xl border p-4 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
                link.accent
                  ? "bg-accent/10 border-accent/30 hover:bg-accent/20 hover:border-accent/50 hover:shadow-[0_0_30px_rgba(var(--color-accent-rgb,0,255,200),0.15)]"
                  : "bg-white/[0.03] border-white/10 hover:bg-white/[0.06] hover:border-white/20"
              }`}
            >
              <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                link.accent ? "bg-accent/20 text-accent" : "bg-white/5 text-text-muted group-hover:text-accent"
              } transition-colors`}>
                <link.icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-sm ${link.accent ? "text-accent" : "text-text"}`}>
                  {link.title}
                </p>
                <p className="text-text-muted text-xs truncate">{link.desc}</p>
              </div>
              {link.external && (
                <ExternalLink className="w-4 h-4 text-text-muted flex-shrink-0" />
              )}
            </a>
          ))}
        </div>

        {/* Social Links */}
        <div className="text-center mb-8">
          <p className="text-text-muted text-xs font-medium uppercase tracking-widest mb-4">{t.followUs}</p>
          <div className="flex justify-center gap-3">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="group w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-text-muted hover:text-white hover:border-accent/50 transition-all duration-300 hover:scale-110 hover:shadow-[0_0_20px_rgba(var(--color-accent-rgb,0,255,200),0.15)]"
              >
                <s.icon className="w-5 h-5" />
              </a>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <div className="h-px w-24 mx-auto bg-gradient-to-r from-transparent via-white/10 to-transparent mb-4" />
          <p className="text-text-muted text-xs mb-2">{t.footer}</p>
          <div className="flex items-center justify-center gap-3 text-text-muted text-[10px] mb-2">
            <a href="/terms" className="hover:text-accent transition-colors">{t.terms}</a>
            <span className="w-0.5 h-0.5 rounded-full bg-white/20" />
            <a href="/privacy" className="hover:text-accent transition-colors">{t.privacy}</a>
            <span className="w-0.5 h-0.5 rounded-full bg-white/20" />
            <a href="/refund-policy" className="hover:text-accent transition-colors">{t.refund}</a>
          </div>
          <p className="text-text-muted text-[10px]">
            © {new Date().getFullYear()} ETNYX
          </p>
        </div>
      </div>
    </div>
  );
}
