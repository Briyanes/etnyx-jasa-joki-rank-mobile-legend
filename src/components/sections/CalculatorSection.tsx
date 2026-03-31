"use client";

import { useState, useCallback } from "react";
import { RankTier } from "@/types";
import { rankOptions } from "@/lib/constants";
import { calculatePrice, formatRupiah, isValidRankProgression, createWhatsAppUrl } from "@/utils/helpers";

export default function CalculatorSection() {
  const [currentRank, setCurrentRank] = useState<RankTier>("epic");
  const [targetRank, setTargetRank] = useState<RankTier>("mythic");
  const [isExpress, setIsExpress] = useState(false);
  const [isPremium, setIsPremium] = useState(false);

  const price = calculatePrice(currentRank, targetRank, isExpress, isPremium);
  const isValidProgression = isValidRankProgression(currentRank, targetRank);

  const handleCurrentRankChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as RankTier;
    setCurrentRank(value);
  }, []);

  const handleTargetRankChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as RankTier;
    setTargetRank(value);
  }, []);

  const handleOrder = useCallback(() => {
    const packageDetails = `Calculator - ${rankOptions.find(r => r.value === currentRank)?.label} → ${rankOptions.find(r => r.value === targetRank)?.label}${isExpress ? " (Express)" : ""}${isPremium ? " (Premium)" : ""} - ${formatRupiah(price)}`;
    window.open(createWhatsAppUrl(packageDetails), "_blank", "noopener,noreferrer");
  }, [currentRank, targetRank, isExpress, isPremium, price]);

  return (
    <section id="calculator" className="py-20 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-text mb-4">
            Kalkulator <span className="gradient-text">Harga</span>
          </h2>
          <p className="text-text-muted text-lg">
            Hitung estimasi biaya joki rankmu secara instan
          </p>
        </div>

        {/* Calculator Card */}
        <div className="bg-surface rounded-3xl p-6 sm:p-8 border border-white/5 glow-accent">
          {/* Rank Selectors */}
          <div className="grid sm:grid-cols-2 gap-6 mb-8">
            {/* Current Rank */}
            <div>
              <label
                htmlFor="currentRank"
                className="block text-sm text-text-muted mb-3 font-medium"
              >
                Rank Sekarang
              </label>
              <select
                id="currentRank"
                value={currentRank}
                onChange={handleCurrentRankChange}
                className="w-full bg-background border border-white/10 rounded-xl px-4 py-4 text-text focus:border-accent focus:outline-none transition-colors appearance-none cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239CA3AF'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 1rem center",
                  backgroundSize: "1.5rem",
                }}
              >
                {rankOptions.map((rank) => (
                  <option key={rank.value} value={rank.value}>
                    {rank.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Target Rank */}
            <div>
              <label
                htmlFor="targetRank"
                className="block text-sm text-text-muted mb-3 font-medium"
              >
                Target Rank
              </label>
              <select
                id="targetRank"
                value={targetRank}
                onChange={handleTargetRankChange}
                className="w-full bg-background border border-white/10 rounded-xl px-4 py-4 text-text focus:border-accent focus:outline-none transition-colors appearance-none cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239CA3AF'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 1rem center",
                  backgroundSize: "1.5rem",
                }}
              >
                {rankOptions.map((rank) => (
                  <option key={rank.value} value={rank.value}>
                    {rank.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Add-ons */}
          <div className="flex flex-wrap gap-4 mb-8">
            <label className="flex items-center gap-3 bg-background/50 px-5 py-4 rounded-xl cursor-pointer hover:bg-background transition-colors border border-transparent hover:border-white/10">
              <input
                type="checkbox"
                checked={isExpress}
                onChange={(e) => setIsExpress(e.target.checked)}
                className="w-5 h-5 rounded accent-accent cursor-pointer"
              />
              <span className="text-text">
                ⚡ Express{" "}
                <span className="text-accent font-semibold">(+20%)</span>
              </span>
            </label>

            <label className="flex items-center gap-3 bg-background/50 px-5 py-4 rounded-xl cursor-pointer hover:bg-background transition-colors border border-transparent hover:border-white/10">
              <input
                type="checkbox"
                checked={isPremium}
                onChange={(e) => setIsPremium(e.target.checked)}
                className="w-5 h-5 rounded accent-accent cursor-pointer"
              />
              <span className="text-text">
                👑 Premium Booster{" "}
                <span className="text-accent font-semibold">(+30%)</span>
              </span>
            </label>
          </div>

          {/* Price Result */}
          <div className="bg-background rounded-2xl p-6 sm:p-8 text-center mb-6">
            <p className="text-text-muted mb-3">Estimasi Harga</p>
            {isValidProgression ? (
              <p className="text-4xl sm:text-5xl font-extrabold gradient-text">
                {formatRupiah(price)}
              </p>
            ) : (
              <p className="text-xl text-warning">
                Target rank harus lebih tinggi dari rank sekarang
              </p>
            )}
          </div>

          {/* Order Button */}
          <button
            onClick={handleOrder}
            disabled={!isValidProgression}
            className="w-full gradient-primary py-4 rounded-2xl text-white font-bold text-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Order Sekarang via WhatsApp
          </button>
        </div>
      </div>
    </section>
  );
}
