"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useLanguage } from "@/contexts/LanguageContext";

interface PortfolioItem {
  id: string;
  title: string;
  rank_from: string;
  rank_to: string;
  image_before_url: string | null;
  image_after_url: string | null;
  description: string | null;
}

const rankLabels: Record<string, string> = {
  warrior: "Warrior",
  elite: "Elite",
  master: "Master",
  grandmaster: "Grandmaster",
  epic: "Epic",
  legend: "Legend",
  mythic: "Mythic",
  mythicglory: "Mythic Glory",
};

const rankIcons: Record<string, string> = {
  warrior: "/icons-tier/Warrior.webp",
  elite: "/icons-tier/Elite.webp",
  master: "/icons-tier/Master.webp",
  grandmaster: "/icons-tier/Grandmaster.webp",
  epic: "/icons-tier/Epic.webp",
  legend: "/icons-tier/Legend.webp",
  mythic: "/icons-tier/Mythic.webp",
  mythicglory: "/icons-tier/Mythical_Glory.webp",
  mythichonor: "/icons-tier/Mythical_Honor.webp",
  mythicimmortal: "/icons-tier/Mythical_Immortal.webp",
};

// Static portfolio data
const staticPortfolio: PortfolioItem[] = [
  {
    id: "1",
    title: "Push Rank Epic to Mythic",
    rank_from: "epic",
    rank_to: "mythic",
    image_before_url: null,
    image_after_url: null,
    description: "Selesai dalam 3 hari dengan 78% winrate",
  },
  {
    id: "2",
    title: "Legend to Mythic Glory",
    rank_from: "legend",
    rank_to: "mythicglory",
    image_before_url: null,
    image_after_url: null,
    description: "Selesai dalam 5 hari dengan 82% winrate",
  },
  {
    id: "3",
    title: "Grandmaster to Legend",
    rank_from: "grandmaster",
    rank_to: "legend",
    image_before_url: null,
    image_after_url: null,
    description: "Selesai dalam 2 hari dengan 85% winrate",
  },
  {
    id: "4",
    title: "Master to Epic",
    rank_from: "master",
    rank_to: "epic",
    image_before_url: null,
    image_after_url: null,
    description: "Selesai dalam 1 hari dengan 90% winrate",
  },
  {
    id: "5",
    title: "Epic to Legend",
    rank_from: "epic",
    rank_to: "legend",
    image_before_url: null,
    image_after_url: null,
    description: "Selesai dalam 2 hari dengan 80% winrate",
  },
  {
    id: "6",
    title: "Warrior to Grandmaster",
    rank_from: "warrior",
    rank_to: "grandmaster",
    image_before_url: null,
    image_after_url: null,
    description: "Selesai dalam 2 hari dengan 88% winrate",
  },
];

export default function Portfolio() {
  const { locale } = useLanguage();
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>(staticPortfolio);
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);

  const t = {
    id: {
      badge: "PORTFOLIO",
      title: "Hasil",
      titleHighlight: "Kerja",
      titleEnd: "Kami",
      subtitle: "Bukti nyata push rank dari customer ETNYX",
      viewDetail: "Lihat Detail",
      before: "Sebelum",
      after: "Sesudah",
      orderSimilar: "Order Push Rank Serupa",
    },
    en: {
      badge: "PORTFOLIO",
      title: "Our",
      titleHighlight: "Work",
      titleEnd: "Results",
      subtitle: "Real proof of rank push from ETNYX customers",
      viewDetail: "View Detail",
      before: "Before",
      after: "After",
      orderSimilar: "Order Similar Push Rank",
    },
  };

  const txt = t[locale];

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const res = await fetch("/api/portfolio");
        if (res.ok) {
          const data = await res.json();
          if (data.length > 0) {
            setPortfolio(data);
          }
        }
      } catch {
        // Keep static data
      }
    };
    fetchPortfolio();
  }, []);

  return (
    <section id="portfolio" className="py-10 lg:py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-6">
          <span className="inline-block px-3 py-1 text-[10px] sm:text-xs font-medium text-accent bg-accent/10 rounded-full mb-3">
            {txt.badge}
          </span>
          <h2 className="text-2xl md:text-3xl font-bold text-text mb-2">
            {txt.title} <span className="text-primary">{txt.titleHighlight}</span> {txt.titleEnd}
          </h2>
          <p className="text-muted max-w-lg mx-auto text-sm">
            {txt.subtitle}
          </p>
        </div>

        {/* Portfolio Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {portfolio.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className="group bg-surface rounded-2xl overflow-hidden border border-surface/50 hover:border-primary/30 transition-all cursor-pointer"
            >
              {/* Image or Placeholder */}
              <div className="relative aspect-video bg-gradient-to-br from-primary/20 to-accent/20">
                {item.image_after_url ? (
                  <img
                    src={item.image_after_url}
                    alt={item.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-3 mb-2">
                        {/* Before Rank Icon */}
                        <div className="flex flex-col items-center gap-1">
                          <Image
                            src={rankIcons[item.rank_from] || "/icons-tier/Epic.webp"}
                            alt={rankLabels[item.rank_from] || item.rank_from}
                            width={48}
                            height={48}
                            className="drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]"
                          />
                          <span className="text-xs font-semibold text-text/80">{rankLabels[item.rank_from]}</span>
                        </div>
                        {/* Arrow */}
                        <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                        {/* After Rank Icon */}
                        <div className="flex flex-col items-center gap-1">
                          <Image
                            src={rankIcons[item.rank_to] || "/icons-tier/Mythic.webp"}
                            alt={rankLabels[item.rank_to] || item.rank_to}
                            width={48}
                            height={48}
                            className="drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]"
                          />
                          <span className="text-xs font-semibold text-text/80">{rankLabels[item.rank_to]}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="px-4 py-2 bg-primary text-background rounded-lg font-medium text-sm">
                    {txt.viewDetail}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-semibold text-text mb-2 group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
                {item.description && (
                  <p className="text-sm text-muted">{item.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Modal */}
        {selectedItem && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
            onClick={() => setSelectedItem(null)}
          >
            <div
              className="bg-surface rounded-2xl max-w-lg w-full p-6 border border-surface/50"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-text">{selectedItem.title}</h3>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="p-2 hover:bg-background rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Rank Progress */}
              <div className="flex items-center justify-center gap-6 mb-6 p-6 bg-background rounded-xl">
                <div className="text-center">
                  <Image
                    src={rankIcons[selectedItem.rank_from] || "/icons-tier/Epic.webp"}
                    alt={rankLabels[selectedItem.rank_from] || selectedItem.rank_from}
                    width={56}
                    height={56}
                    className="mx-auto mb-2 drop-shadow-[0_0_12px_rgba(255,255,255,0.3)]"
                  />
                  <p className="text-sm font-bold text-text">{rankLabels[selectedItem.rank_from]}</p>
                  <p className="text-xs text-muted">{txt.before}</p>
                </div>
                <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                <div className="text-center">
                  <Image
                    src={rankIcons[selectedItem.rank_to] || "/icons-tier/Mythic.webp"}
                    alt={rankLabels[selectedItem.rank_to] || selectedItem.rank_to}
                    width={56}
                    height={56}
                    className="mx-auto mb-2 drop-shadow-[0_0_12px_rgba(255,255,255,0.3)]"
                  />
                  <p className="text-sm font-bold text-text">{rankLabels[selectedItem.rank_to]}</p>
                  <p className="text-xs text-muted">{txt.after}</p>
                </div>
              </div>

              {/* Screenshot Image */}
              {selectedItem.image_after_url && (
                <div className="mb-6 rounded-xl overflow-hidden border border-white/10">
                  <img
                    src={selectedItem.image_after_url}
                    alt={selectedItem.title}
                    className="w-full h-auto"
                  />
                </div>
              )}

              {selectedItem.description && (
                <p className="text-muted text-center mb-6">{selectedItem.description}</p>
              )}

              {/* CTA */}
              <a
                href={`https://wa.me/6281414131321?text=${encodeURIComponent(`Halo kak, saya mau order joki ${selectedItem.rank_from} ke ${selectedItem.rank_to}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-3 bg-primary hover:bg-primary/90 text-background font-semibold rounded-xl text-center transition-all"
              >
                {txt.orderSimilar}
              </a>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
