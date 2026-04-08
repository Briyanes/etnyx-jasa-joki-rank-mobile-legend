"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Trophy, Star, Loader2, Crown, Medal,
  Swords, Target, Clock, Award, Flame,
  TrendingUp, Gamepad2, ChevronUp, ChevronDown,
} from "lucide-react";

interface WorkerStats {
  id: string;
  name: string;
  email: string;
  totalAssigned: number;
  totalCompleted: number;
  totalInProgress: number;
  totalStars: number;
  totalMVP: number;
  totalSavage: number;
  totalManiac: number;
  totalMatches: number;
  totalWins: number;
  winRate: number;
  totalMinutes: number;
  avgRating: number;
  totalReviews: number;
  score: number;
}

type SortKey = "score" | "totalCompleted" | "winRate" | "avgRating" | "totalMVP" | "totalSavage";

const PODIUM_STYLES = [
  { bg: "bg-yellow-500/10", border: "border-yellow-500/30", icon: Crown, color: "text-yellow-400", medal: "🥇" },
  { bg: "bg-gray-400/10", border: "border-gray-400/30", icon: Medal, color: "text-gray-300", medal: "🥈" },
  { bg: "bg-orange-500/10", border: "border-orange-500/30", icon: Award, color: "text-orange-400", medal: "🥉" },
];

export default function LeaderboardTab() {
  const [workers, setWorkers] = useState<WorkerStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortKey>("score");
  const [sortAsc, setSortAsc] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/worker-leaderboard");
      const json = await res.json();
      if (json.leaderboard) setWorkers(json.leaderboard);
    } catch (err) {
      console.error("Leaderboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(key);
      setSortAsc(false);
    }
  };

  const sorted = [...workers].sort((a, b) => {
    const diff = sortAsc ? a[sortBy] - b[sortBy] : b[sortBy] - a[sortBy];
    return diff;
  });

  const top3 = sorted.slice(0, 3);
  const rest = sorted.slice(3);

  const SortIcon = ({ field }: { field: SortKey }) => {
    if (sortBy !== field) return null;
    return sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (workers.length === 0) {
    return (
      <div className="text-center py-12">
        <Trophy className="w-12 h-12 text-text-muted mx-auto mb-3" />
        <p className="text-text-muted">Belum ada data worker</p>
      </div>
    );
  }

  // Aggregate stats
  const totalCompleted = workers.reduce((s, w) => s + w.totalCompleted, 0);
  const totalMVP = workers.reduce((s, w) => s + w.totalMVP, 0);
  const totalSavage = workers.reduce((s, w) => s + w.totalSavage, 0);
  const avgWinRate = workers.length > 0
    ? Math.round(workers.reduce((s, w) => s + w.winRate, 0) / workers.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-text flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-400" /> Worker Leaderboard
        </h2>
        <div className="flex gap-1 bg-surface rounded-lg p-1 border border-white/5">
          {([
            { key: "score" as SortKey, label: "Score" },
            { key: "totalCompleted" as SortKey, label: "Orders" },
            { key: "winRate" as SortKey, label: "Win %" },
            { key: "avgRating" as SortKey, label: "Rating" },
          ]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => handleSort(key)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${
                sortBy === key ? "bg-accent text-white" : "text-text-muted hover:text-text"
              }`}
            >
              {label} <SortIcon field={key} />
            </button>
          ))}
        </div>
      </div>

      {/* Team Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Completed", value: totalCompleted, icon: Target, color: "text-green-400", bg: "bg-green-500/10" },
          { label: "Total MVP", value: totalMVP, icon: Crown, color: "text-yellow-400", bg: "bg-yellow-500/10" },
          { label: "Total Savage", value: totalSavage, icon: Flame, color: "text-red-400", bg: "bg-red-500/10" },
          { label: "Avg Win Rate", value: `${avgWinRate}%`, icon: TrendingUp, color: "text-cyan-400", bg: "bg-cyan-500/10" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-surface rounded-xl p-4 border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
            </div>
            <p className="text-xl font-bold text-text">{value}</p>
            <p className="text-xs text-text-muted">{label}</p>
          </div>
        ))}
      </div>

      {/* Podium - Top 3 */}
      {top3.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {top3.map((w, i) => {
            const style = PODIUM_STYLES[i];
            const Icon = style.icon;
            return (
              <div key={w.id} className={`${style.bg} rounded-xl p-5 border ${style.border} relative overflow-hidden`}>
                <div className="absolute top-3 right-3 text-3xl opacity-30">{style.medal}</div>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-full ${style.bg} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${style.color}`} />
                  </div>
                  <div>
                    <p className="text-text font-bold">{w.name}</p>
                    <p className="text-xs text-text-muted">{w.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className={`text-lg font-bold ${style.color}`}>{w.totalCompleted}</p>
                    <p className="text-[10px] text-text-muted">Selesai</p>
                  </div>
                  <div>
                    <p className={`text-lg font-bold ${style.color}`}>{w.winRate}%</p>
                    <p className="text-[10px] text-text-muted">Win Rate</p>
                  </div>
                  <div>
                    <p className={`text-lg font-bold ${style.color}`}>
                      {w.avgRating > 0 ? w.avgRating : "-"}
                    </p>
                    <p className="text-[10px] text-text-muted">Rating</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-[10px] text-text-muted">
                    <span className="flex items-center gap-0.5"><Crown className="w-3 h-3 text-yellow-400" /> {w.totalMVP} MVP</span>
                    <span className="flex items-center gap-0.5"><Flame className="w-3 h-3 text-red-400" /> {w.totalSavage} Savage</span>
                    <span className="flex items-center gap-0.5"><Swords className="w-3 h-3 text-purple-400" /> {w.totalManiac} Maniac</span>
                  </div>
                  <p className="text-xs font-bold text-accent">{w.score} pts</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full Table */}
      {rest.length > 0 && (
        <div className="bg-surface rounded-xl border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] uppercase text-text-muted border-b border-white/5">
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Worker</th>
                  <th className="px-4 py-3 cursor-pointer hover:text-text" onClick={() => handleSort("totalCompleted")}>
                    <span className="flex items-center gap-1">Completed <SortIcon field="totalCompleted" /></span>
                  </th>
                  <th className="px-4 py-3 cursor-pointer hover:text-text" onClick={() => handleSort("winRate")}>
                    <span className="flex items-center gap-1">Win Rate <SortIcon field="winRate" /></span>
                  </th>
                  <th className="px-4 py-3 cursor-pointer hover:text-text" onClick={() => handleSort("avgRating")}>
                    <span className="flex items-center gap-1">Rating <SortIcon field="avgRating" /></span>
                  </th>
                  <th className="px-4 py-3 cursor-pointer hover:text-text" onClick={() => handleSort("totalMVP")}>
                    <span className="flex items-center gap-1">MVP <SortIcon field="totalMVP" /></span>
                  </th>
                  <th className="px-4 py-3">Stars</th>
                  <th className="px-4 py-3">Matches</th>
                  <th className="px-4 py-3">Hours</th>
                  <th className="px-4 py-3 cursor-pointer hover:text-text" onClick={() => handleSort("score")}>
                    <span className="flex items-center gap-1">Score <SortIcon field="score" /></span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rest.map((w, i) => (
                  <tr key={w.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 text-xs text-text-muted">{i + 4}</td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-text font-medium">{w.name}</p>
                      <p className="text-[10px] text-text-muted">{w.email}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-green-400 font-medium">{w.totalCompleted}</td>
                    <td className="px-4 py-3 text-sm text-cyan-400">{w.winRate}%</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-sm text-yellow-400">
                        <Star className="w-3 h-3" /> {w.avgRating > 0 ? w.avgRating : "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-text">{w.totalMVP}</td>
                    <td className="px-4 py-3 text-sm text-purple-400">{w.totalStars}</td>
                    <td className="px-4 py-3 text-sm text-text-muted">{w.totalMatches}</td>
                    <td className="px-4 py-3 text-sm text-text-muted">
                      {w.totalMinutes > 0 ? `${Math.round(w.totalMinutes / 60)}h` : "-"}
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-accent">{w.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Achievements */}
      <div className="bg-surface rounded-xl p-5 border border-white/5">
        <h3 className="text-sm font-semibold text-text mb-4 flex items-center gap-2">
          <Gamepad2 className="w-4 h-4 text-accent" /> Highlights
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(() => {
            const mostCompleted = sorted[0];
            const bestWinRate = [...workers].sort((a, b) => b.winRate - a.winRate)[0];
            const mvpKing = [...workers].sort((a, b) => b.totalMVP - a.totalMVP)[0];
            const savageKing = [...workers].sort((a, b) => b.totalSavage - a.totalSavage)[0];

            return [
              { label: "Most Completed", worker: mostCompleted?.name, value: `${mostCompleted?.totalCompleted || 0} orders`, icon: Target, color: "text-green-400" },
              { label: "Best Win Rate", worker: bestWinRate?.name, value: `${bestWinRate?.winRate || 0}%`, icon: TrendingUp, color: "text-cyan-400" },
              { label: "MVP King", worker: mvpKing?.name, value: `${mvpKing?.totalMVP || 0} MVP`, icon: Crown, color: "text-yellow-400" },
              { label: "Savage Master", worker: savageKing?.name, value: `${savageKing?.totalSavage || 0} Savage`, icon: Flame, color: "text-red-400" },
            ].map(({ label, worker, value, icon: Icon, color }) => (
              <div key={label} className="bg-white/[0.02] rounded-lg p-3 border border-white/5">
                <div className="flex items-center gap-1.5 mb-2">
                  <Icon className={`w-3.5 h-3.5 ${color}`} />
                  <p className="text-[10px] text-text-muted uppercase">{label}</p>
                </div>
                <p className="text-sm text-text font-medium truncate">{worker || "-"}</p>
                <p className={`text-xs ${color} font-bold`}>{value}</p>
              </div>
            ));
          })()}
        </div>
      </div>
    </div>
  );
}
