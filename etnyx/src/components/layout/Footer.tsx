"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { WHATSAPP_NUMBER } from "@/lib/constants";
import Image from "next/image";
import Link from "next/link";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
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

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
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

export default function Footer() {
  const { locale } = useLanguage();
  const currentYear = new Date().getFullYear();

  const [socialLinks, setSocialLinks] = useState<{ instagram: string; facebook: string; tiktok: string; youtube: string; whatsapp: string } | null>(null);
  const [siteInfo, setSiteInfo] = useState<{ supportEmail: string; companyName: string; address: string; phone: string } | null>(null);

  useEffect(() => {
    fetch("/api/settings?keys=social_links,site_info")
      .then((r) => r.json())
      .then((d) => {
        if (d.social_links) setSocialLinks(d.social_links);
        if (d.site_info) setSiteInfo(d.site_info);
      })
      .catch(() => {});
  }, []);

  const t = {
    id: {
      tagline: "Jasa joki & gendong Mobile Legends terpercaya. Tinggal order, booster kami yang push rank kamu.",
      nav: "Navigasi",
      legal: "Legal",
      social: "Ikuti Kami",
    },
    en: {
      tagline: "Trusted Mobile Legends boosting service. Just order, our boosters push your rank.",
      nav: "Navigation",
      legal: "Legal",
      social: "Follow Us",
    },
  };

  const txt = t[locale];

  const navLinks = locale === "id" ? [
    { href: "/order", label: "Order Joki" },
    { href: "/track", label: "Lacak Order" },
    { href: "/#pricing", label: "Paket Harga" },
    { href: "/#faq", label: "FAQ" },
  ] : [
    { href: "/order", label: "Order Boost" },
    { href: "/track", label: "Track Order" },
    { href: "/#pricing", label: "Pricing" },
    { href: "/#faq", label: "FAQ" },
  ];

  const legalLinks = [
    { href: "/terms", label: locale === "id" ? "Syarat & Ketentuan" : "Terms of Service" },
    { href: "/privacy", label: locale === "id" ? "Kebijakan Privasi" : "Privacy Policy" },
    { href: "/refund-policy", label: locale === "id" ? "Kebijakan Refund" : "Refund Policy" },
  ];

  const socials = [
    { href: socialLinks?.instagram || "https://instagram.com/etnyx_ml", label: "Instagram", icon: InstagramIcon },
    { href: socialLinks?.facebook || "https://facebook.com/etnyx_ml", label: "Facebook", icon: FacebookIcon },
    { href: socialLinks?.tiktok || "https://tiktok.com/@etnyx_ml", label: "TikTok", icon: TikTokIcon },
    { href: socialLinks?.youtube || "https://youtube.com/@etnyx_ml", label: "YouTube", icon: YoutubeIcon },
  ];

  return (
    <footer className="relative overflow-hidden">
      {/* Top accent glow line */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-accent/50 to-transparent" />

      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative pt-10 sm:pt-14 pb-6 sm:pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Top section: Logo + Social centered */}
          <div className="flex flex-col items-center text-center mb-8 sm:mb-12">
            <Image
              src="/logo/circle-landscape.webp"
              alt="ETNYX"
              width={160}
              height={40}
              className="h-8 sm:h-10 w-auto mb-4 sm:mb-5"
            />
            <p className="text-text-muted text-xs sm:text-sm leading-relaxed max-w-xs sm:max-w-md mb-5 sm:mb-6">
              {txt.tagline}
            </p>

            {/* Social icons */}
            <div className="flex gap-3 sm:gap-4">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="group relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-text-muted hover:text-white hover:border-accent/50 transition-all duration-300 hover:scale-110 hover:shadow-[0_0_20px_rgba(var(--color-accent-rgb,0,255,200),0.15)]"
                >
                  <s.icon className="w-4 h-4 sm:w-5 sm:h-5 relative z-10" />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-accent/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </a>
              ))}
            </div>
          </div>

          {/* Navigation — stacked on mobile, row on tablet+ */}
          <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-x-12 md:gap-x-16 gap-y-4 sm:gap-y-5 mb-8 sm:mb-12">
            {/* Nav links */}
            <div className="flex flex-wrap items-center justify-center gap-x-4 sm:gap-x-6 gap-y-1.5">
              <h4 className="text-accent/80 font-semibold text-[10px] sm:text-xs uppercase tracking-widest">
                {txt.nav}
              </h4>
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} className="text-text-muted hover:text-white text-xs sm:text-sm transition-colors duration-200">
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Legal */}
            <div className="flex flex-wrap items-center justify-center gap-x-4 sm:gap-x-6 gap-y-1.5">
              <h4 className="text-accent/80 font-semibold text-[10px] sm:text-xs uppercase tracking-widest">
                {txt.legal}
              </h4>
              {legalLinks.map((link) => (
                <Link key={link.href} href={link.href} className="text-text-muted hover:text-white text-xs sm:text-sm transition-colors duration-200">
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Contact */}
            <div className="flex flex-wrap items-center justify-center gap-x-4 sm:gap-x-6 gap-y-1.5">
              <h4 className="text-accent/80 font-semibold text-[10px] sm:text-xs uppercase tracking-widest">
                {locale === "id" ? "Kontak" : "Contact"}
              </h4>
              <a href={`https://wa.me/${socialLinks?.whatsapp || WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer" onClick={() => { import("@/lib/tracking").then(m => m.trackLead()); }} className="text-text-muted hover:text-white text-xs sm:text-sm transition-colors duration-200">
                WhatsApp
              </a>
              <a href={`mailto:${siteInfo?.supportEmail || "support@etnyx.id"}`} className="text-text-muted hover:text-white text-xs sm:text-sm transition-colors duration-200">
                {siteInfo?.supportEmail || "support@etnyx.id"}
              </a>
            </div>
          </div>

          {/* Bottom divider with glow */}
          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent mb-5 sm:mb-6" />

          {/* Address & Company Info */}
          <div className="text-center mb-5 sm:mb-6 space-y-1">
            <p className="text-text-muted/40 text-[10px] sm:text-xs tracking-wide font-medium">
              {siteInfo?.companyName || "PT Sumber Arto Moro Abadi Kreatif"}
            </p>
            <p className="text-text-muted/30 text-[10px] sm:text-xs">
              {siteInfo?.address || "Jl. Kaliurang KM 5.5, Caturtunggal, Depok, Sleman, D.I. Yogyakarta 55281, Indonesia"}
            </p>
            <p className="text-text-muted/30 text-[10px] sm:text-xs">
              Email: {siteInfo?.supportEmail || "support@etnyx.id"} • WhatsApp: {siteInfo?.phone || "+62 815-1514-1452"}
            </p>
          </div>

          {/* Bottom divider */}
          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent mb-5 sm:mb-6" />

          {/* Bottom bar */}
          <div className="flex flex-col items-center gap-2 sm:gap-3">
            <div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-6">
              <p className="text-text-muted/50 text-[10px] sm:text-xs">
                © {currentYear} ETNYX. All rights reserved.
              </p>
              <span className="hidden sm:block text-text-muted/20">•</span>
              <p className="text-text-muted/30 text-[10px] sm:text-xs">
                Designed &amp; Developed by <span className="text-text-muted/50 hover:text-accent transition-colors cursor-default">Briyanes</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
