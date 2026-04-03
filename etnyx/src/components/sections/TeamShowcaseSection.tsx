"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Cat, Crown, Bird, Flame } from "lucide-react";
import { ReactNode } from "react";
import CardCarousel from "@/components/CardCarousel";

interface Booster {
  id: number;
  name: string;
  icon: ReactNode;
  rank: string;
  winrate: string;
  totalOrders: number;
  specialization: string;
  isOnline: boolean;
}

interface DbBooster {
  id: string;
  name: string;
  rank_specialization: string;
  specialization: string[] | null;
  is_available: boolean;
  total_orders: number;
  rating: number;
}

const specLabels: Record<string, string> = {
  tank: "Tank", fighter: "Fighter", assassin: "Assassin", mage: "Mage",
  marksman: "Marksman", support: "Support",
};

const defaultIcons: ReactNode[] = [
  <Cat key="cat" className="w-10 h-10" />,
  <Crown key="crown" className="w-10 h-10" />,
  <Bird key="bird" className="w-10 h-10" />,
  <Flame key="flame" className="w-10 h-10" />,
];

const defaultBoosters: Booster[] = [
  { id: 1, name: "RexZero", icon: defaultIcons[0], rank: "Mythical Glory", winrate: "87%", totalOrders: 1250, specialization: "Assassin/Mage", isOnline: true },
  { id: 2, name: "ShadowKing", icon: defaultIcons[1], rank: "Mythical Glory", winrate: "84%", totalOrders: 980, specialization: "Tank/Fighter", isOnline: true },
  { id: 3, name: "NightOwl", icon: defaultIcons[2], rank: "Mythical Glory", winrate: "82%", totalOrders: 756, specialization: "Marksman/Mage", isOnline: false },
  { id: 4, name: "PhoenixML", icon: defaultIcons[3], rank: "Mythic", winrate: "79%", totalOrders: 543, specialization: "All Roles", isOnline: true },
];

function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export default function TeamShowcaseSection() {
  const { locale } = useLanguage();
  const [boosters, setBoosters] = useState<Booster[]>(defaultBoosters);

  useEffect(() => {
    fetch("/api/boosters")
      .then((res) => res.json())
      .then((data) => {
        if (data.boosters && Array.isArray(data.boosters) && data.boosters.length > 0) {
          const dbBoosters: DbBooster[] = data.boosters;
          setBoosters(
            dbBoosters.map((b, i) => ({
              id: i + 1,
              name: b.name,
              icon: defaultIcons[i % defaultIcons.length],
              rank: b.rank_specialization || "Mythic",
              winrate: `${Math.round(b.rating * 20)}%`,
              totalOrders: b.total_orders,
              specialization: b.specialization
                ? b.specialization.map((s) => specLabels[s] || s).join("/")
                : "All Roles",
              isOnline: b.is_available,
            }))
          );
        }
      })
      .catch(() => {});
  }, []);

  const t = {
    id: { badge: "TIM BOOSTER", title: "Booster", titleHighlight: "Unggulan", titleEnd: "Kami", subtitle: "Tim profesional dengan pengalaman bertahun-tahun di Mobile Legends", winrate: "Winrate", orders: "Order Selesai", specialization: "Spesialisasi", online: "Online", offline: "Offline" },
    en: { badge: "BOOSTER TEAM", title: "Our", titleHighlight: "Top", titleEnd: "Boosters", subtitle: "Professional team with years of experience in Mobile Legends", winrate: "Winrate", orders: "Orders Done", specialization: "Specialization", online: "Online", offline: "Offline" },
  };

  const txt = t[locale];

  return (
    <section id="team" className="relative py-10 lg:py-14 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-accent/3 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-3 py-1 mb-3">
            <span className="text-accent text-[10px] sm:text-xs font-semibold uppercase tracking-widest">{txt.badge}</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-text mb-2">{txt.title} <span className="text-accent">{txt.titleHighlight}</span> {txt.titleEnd}</h2>
          <p className="text-text-muted max-w-lg mx-auto text-xs sm:text-sm">{txt.subtitle}</p>
        </div>

        <CardCarousel desktopCols={4} tabletCols={2}>
          {boosters.map((booster) => (
            <div key={booster.id} className="group bg-white/[0.03] rounded-xl p-4 sm:p-5 border border-white/5 hover:border-accent/20 hover:bg-white/[0.05] transition-all duration-300 hover:-translate-y-1 relative overflow-hidden h-full">
              <div className={`absolute top-4 right-4 flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${booster.isOnline ? "bg-success/20 text-success" : "bg-gray-500/20 text-gray-400"}`}>
                <span className={`w-2 h-2 rounded-full ${booster.isOnline ? "bg-success animate-pulse" : "bg-gray-400"}`} />
                {booster.isOnline ? txt.online : txt.offline}
              </div>

              <div className="flex justify-center mb-3">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white group-hover:scale-110 transition-transform shadow-lg">
                  {booster.icon}
                </div>
              </div>

              <div className="text-center mb-3">
                <h3 className="text-lg font-bold text-text group-hover:text-accent transition-colors">{booster.name}</h3>
                <p className="text-xs text-accent font-medium">{booster.rank}</p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted">{txt.winrate}</span>
                  <span className="font-bold text-success">{booster.winrate}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted">{txt.orders}</span>
                  <span className="font-bold text-text">{formatNumber(booster.totalOrders)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted">{txt.specialization}</span>
                  <span className="font-medium text-primary text-xs">{booster.specialization}</span>
                </div>
              </div>

              <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-accent via-accent/50 to-accent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ))}
        </CardCarousel>
      </div>
    </section>
  );
}
