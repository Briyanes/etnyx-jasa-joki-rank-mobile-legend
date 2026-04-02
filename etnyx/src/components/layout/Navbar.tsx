"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";
import { Search, MapPin } from "lucide-react";

// Map section hash to visibility key
const SECTION_VIS_MAP: Record<string, string> = {
  "#how-it-works": "howItWorks",
  "#pricing": "pricing",
  "#team": "teamShowcase",
  "#testimonials": "testimonials",
  "#portfolio": "portfolio",
  "#tracking": "tracking",
  "#faq": "faq",
};

interface SectionVisibility {
  hero: boolean; liveCounter: boolean; howItWorks: boolean; pricing: boolean;
  whyChooseUs: boolean; teamShowcase: boolean; testimonials: boolean;
  portfolio: boolean; tracking: boolean; trust: boolean; faq: boolean; cta: boolean;
}

interface NavbarProps {
  hiddenSections?: SectionVisibility;
}

export default function Navbar({ hiddenSections }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const { locale } = useLanguage();

  const allNavLinks = locale === "id" ? [
    { href: "#how-it-works", label: "Cara Kerja" },
    { href: "#pricing", label: "Paket" },
    { href: "#team", label: "Tim" },
    { href: "#testimonials", label: "Testimoni" },
    { href: "#portfolio", label: "Portfolio" },
    { href: "#tracking", label: "Tracking" },
    { href: "#faq", label: "FAQ" },
  ] : [
    { href: "#how-it-works", label: "How It Works" },
    { href: "#pricing", label: "Packages" },
    { href: "#team", label: "Team" },
    { href: "#testimonials", label: "Testimonials" },
    { href: "#portfolio", label: "Portfolio" },
    { href: "#tracking", label: "Tracking" },
    { href: "#faq", label: "FAQ" },
  ];

  // Filter out hidden sections
  const navLinks = hiddenSections
    ? allNavLinks.filter((link) => {
        const visKey = SECTION_VIS_MAP[link.href] as keyof SectionVisibility | undefined;
        return !visKey || hiddenSections[visKey] !== false;
      })
    : allNavLinks;

  const mobileExtraLinks = locale === "id" ? [
    { href: "/order", label: "Order Joki" },
    { href: "/track", label: "Lacak Order" },
  ] : [
    { href: "/order", label: "Order Boost" },
    { href: "/track", label: "Track Order" },
  ];

  const orderText = locale === "id" ? "Order Sekarang" : "Order Now";

  // Scroll-spy: track which section is in view
  useEffect(() => {
    const sectionIds = navLinks.map((l) => l.href.replace("#", ""));

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );

    for (const id of sectionIds) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <nav className="glass border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src="/logo/circle-landscape.webp"
              alt="ETNYX"
              width={140}
              height={36}
              className="h-8 sm:h-9 w-auto"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`transition-colors duration-200 text-sm font-medium relative ${
                  activeSection === link.href.replace("#", "")
                    ? "text-accent"
                    : "text-text-muted hover:text-accent"
                }`}
              >
                {link.label}
                {activeSection === link.href.replace("#", "") && (
                  <span className="absolute -bottom-1 left-0 right-0 h-0.5 gradient-primary rounded-full" />
                )}
              </Link>
            ))}
          </div>

          {/* Desktop CTA + Language Switcher */}
          <div className="hidden md:flex items-center gap-3">
            <LanguageSwitcher />
            <Link
              href="/order"
              className="gradient-primary px-6 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity duration-200"
            >
              {orderText}
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <LanguageSwitcher />
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-text-muted hover:text-text transition-colors"
              aria-label="Toggle menu"
              aria-expanded={isMenuOpen}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-white/5 pt-4">
            <div className="flex flex-col gap-3">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`text-sm font-medium transition-colors duration-200 ${
                    activeSection === link.href.replace("#", "")
                      ? "text-accent"
                      : "text-text-muted hover:text-accent"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              
              <div className="border-t border-white/5 pt-3 mt-1 flex flex-col gap-3">
                {mobileExtraLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="text-text-muted hover:text-accent transition-colors duration-200 text-sm font-medium flex items-center gap-2"
                  >
                    {link.href === "/order" ? <Search className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                    {link.label}
                  </Link>
                ))}
              </div>

              <Link
                href="/order"
                onClick={() => setIsMenuOpen(false)}
                className="gradient-primary px-6 py-3 rounded-xl text-white text-sm font-semibold w-full mt-2 text-center"
              >
                {orderText}
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
