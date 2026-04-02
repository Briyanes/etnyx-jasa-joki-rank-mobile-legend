"use client";

import { useState, useEffect } from "react";

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

const rankColors: Record<string, string> = {
  warrior: "from-gray-500 to-gray-600",
  elite: "from-blue-500 to-blue-600",
  master: "from-purple-500 to-purple-600",
  grandmaster: "from-yellow-500 to-yellow-600",
  epic: "from-pink-500 to-pink-600",
  legend: "from-blue-400 to-cyan-500",
  mythic: "from-red-500 to-orange-500",
  mythicglory: "from-amber-400 to-yellow-300",
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
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>(staticPortfolio);
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);

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
    <section id="portfolio" className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-block px-3 py-1 text-xs font-medium text-accent bg-accent/10 rounded-full mb-4">
            PORTFOLIO
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-text mb-4">
            Hasil <span className="text-primary">Kerja</span> Kami
          </h2>
          <p className="text-muted max-w-lg mx-auto">
            Bukti nyata push rank dari customer ETNYX
          </p>
        </div>

        {/* Portfolio Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-3 mb-2">
                        {/* Before Rank Badge */}
                        <div className={`px-3 py-1.5 rounded-lg bg-gradient-to-r ${rankColors[item.rank_from]} text-white text-sm font-medium shadow-lg`}>
                          {rankLabels[item.rank_from]}
                        </div>
                        {/* Arrow */}
                        <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                        {/* After Rank Badge */}
                        <div className={`px-3 py-1.5 rounded-lg bg-gradient-to-r ${rankColors[item.rank_to]} text-white text-sm font-medium shadow-lg`}>
                          {rankLabels[item.rank_to]}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="px-4 py-2 bg-primary text-background rounded-lg font-medium text-sm">
                    Lihat Detail
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
              <div className="flex items-center justify-center gap-4 mb-6 p-6 bg-background rounded-xl">
                <div className="text-center">
                  <div className={`px-4 py-2 rounded-lg bg-gradient-to-r ${rankColors[selectedItem.rank_from]} text-white font-medium shadow-lg mb-2`}>
                    {rankLabels[selectedItem.rank_from]}
                  </div>
                  <p className="text-xs text-muted">Sebelum</p>
                </div>
                <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                <div className="text-center">
                  <div className={`px-4 py-2 rounded-lg bg-gradient-to-r ${rankColors[selectedItem.rank_to]} text-white font-medium shadow-lg mb-2`}>
                    {rankLabels[selectedItem.rank_to]}
                  </div>
                  <p className="text-xs text-muted">Sesudah</p>
                </div>
              </div>

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
                Order Push Rank Serupa
              </a>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
