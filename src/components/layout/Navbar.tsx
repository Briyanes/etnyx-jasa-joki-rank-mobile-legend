"use client";

import { useState } from "react";
import Link from "next/link";
import { createWhatsAppUrl } from "@/utils/helpers";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleOrderClick = () => {
    window.open(createWhatsAppUrl("General Inquiry"), "_blank", "noopener,noreferrer");
  };

  const navLinks = [
    { href: "#calculator", label: "Kalkulator" },
    { href: "#pricing", label: "Paket" },
    { href: "#tracking", label: "Tracking" },
    { href: "#faq", label: "FAQ" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center font-bold text-white text-lg">
              E
            </div>
            <span className="font-bold text-xl text-text">
              ETN<span className="text-accent">YX</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-text-muted hover:text-accent transition-colors duration-200 text-sm font-medium"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop CTA */}
          <button
            onClick={handleOrderClick}
            className="hidden md:block gradient-primary px-6 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity duration-200"
          >
            Order Sekarang
          </button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-text-muted hover:text-text transition-colors"
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

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-white/5 pt-4">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="text-text-muted hover:text-accent transition-colors duration-200 text-sm font-medium"
                >
                  {link.label}
                </Link>
              ))}
              <button
                onClick={() => {
                  handleOrderClick();
                  setIsMenuOpen(false);
                }}
                className="gradient-primary px-6 py-3 rounded-xl text-white text-sm font-semibold w-full mt-2"
              >
                Order Sekarang
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
