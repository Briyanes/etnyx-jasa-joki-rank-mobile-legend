"use client";

import Link from "next/link";
import Image from "next/image";
import { Home, Search, ArrowLeft } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const t = {
  id: {
    title: "Halaman Tidak Ditemukan",
    desc: "Halaman yang kamu cari tidak ada atau sudah dipindahkan.",
    home: "Ke Beranda",
    track: "Track Order",
    back: "Kembali",
  },
  en: {
    title: "Page Not Found",
    desc: "The page you're looking for doesn't exist or has been moved.",
    home: "Go Home",
    track: "Track Order",
    back: "Go Back",
  },
};

export default function NotFound() {
  const { locale } = useLanguage();
  const txt = t[locale as keyof typeof t] || t.id;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <Image
          src="/logo/circle-landscape.webp"
          alt="ETNYX"
          width={140}
          height={40}
          className="mx-auto mb-8"
        />
        <div className="text-8xl font-bold gradient-text mb-4">404</div>
        <h1 className="text-xl font-semibold text-text mb-2">{txt.title}</h1>
        <p className="text-text-muted text-sm mb-8">{txt.desc}</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 px-5 py-2.5 gradient-primary rounded-lg text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Home className="w-4 h-4" /> {txt.home}
          </Link>
          <Link
            href="/track"
            className="flex items-center gap-2 px-5 py-2.5 bg-surface border border-white/10 rounded-lg text-text text-sm hover:bg-white/5 transition-colors"
          >
            <Search className="w-4 h-4" /> {txt.track}
          </Link>
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-5 py-2.5 text-text-muted text-sm hover:text-text transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> {txt.back}
          </button>
        </div>
      </div>
    </div>
  );
}
