"use client";

import { useState, useEffect, useCallback } from "react";
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingCart,
  Target, Plus, Trash2, BarChart3, Loader2,
  Calendar, ChevronDown, Lightbulb,
} from "lucide-react";
import { formatRupiah } from "@/utils/helpers";
import { FaFacebook, FaGoogle, FaTiktok } from "react-icons/fa";

interface SourceStats {
  orders: number;
  revenue: number;
  campaigns: Record<string, { orders: number; revenue: number }>;
}

interface AdSpendEntry {
  id: string;
  date: string;
  platform: string;
  campaign_name: string | null;
  ad_set_name: string | null;
  spend: number;
  impressions: number;
  clicks: number;
  notes: string | null;
}

interface AdsData {
  spend: AdSpendEntry[];
  spendByPlatform: Record<string, number>;
  sourceStats: Record<string, SourceStats>;
  totalOrders: number;
  totalRevenue: number;
  totalSpend: number;
  dateFrom: string;
  dateTo: string;
}

const PLATFORM_CONFIG: Record<string, { label: string; color: string; icon: typeof FaFacebook }> = {
  meta: { label: "Meta Ads", color: "text-blue-400", icon: FaFacebook },
  google: { label: "Google Ads", color: "text-yellow-400", icon: FaGoogle },
  tiktok: { label: "TikTok Ads", color: "text-pink-400", icon: FaTiktok },
  direct: { label: "Direct", color: "text-gray-400", icon: Target },
  other: { label: "Lainnya", color: "text-purple-400", icon: BarChart3 },
};

export default function AdsTab() {
  const [data, setData] = useState<AdsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split("T")[0]);
  const [showAddSpend, setShowAddSpend] = useState(false);
  const [spendForm, setSpendForm] = useState({
    date: new Date().toISOString().split("T")[0],
    platform: "meta",
    campaign_name: "",
    spend: "",
    impressions: "",
    clicks: "",
  });
  const [saving, setSaving] = useState(false);
  const [expandedSource, setExpandedSource] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/ads?from=${dateFrom}&to=${dateTo}`);
      const json = await res.json();
      setData(json);
    } catch {
      /* */
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAddSpend = async () => {
    if (!spendForm.spend || !spendForm.date) return;
    setSaving(true);
    try {
      await fetch("/api/admin/ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: spendForm.date,
          platform: spendForm.platform,
          campaign_name: spendForm.campaign_name || null,
          spend: parseInt(spendForm.spend, 10),
          impressions: spendForm.impressions ? parseInt(spendForm.impressions, 10) : 0,
          clicks: spendForm.clicks ? parseInt(spendForm.clicks, 10) : 0,
        }),
      });
      setSpendForm({ date: new Date().toISOString().split("T")[0], platform: "meta", campaign_name: "", spend: "", impressions: "", clicks: "" });
      setShowAddSpend(false);
      fetchData();
    } catch {
      /* */
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSpend = async (id: string) => {
    if (!confirm("Hapus entry ini?")) return;
    await fetch(`/api/admin/ads?id=${id}`, { method: "DELETE" });
    fetchData();
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-accent animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  const totalProfit = data.totalRevenue - data.totalSpend;
  const roas = data.totalSpend > 0 ? data.totalRevenue / data.totalSpend : 0;
  const cpa = data.totalOrders > 0 ? data.totalSpend / data.totalOrders : 0;
  const isProfitable = totalProfit >= 0;

  return (
    <div className="space-y-6">
      {/* Header + Date Range */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-text">Ad Performance</h2>
          <p className="text-text-muted text-xs mt-1">Analisa ROI, ROAS, dan performa iklan dari semua platform</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-text-muted" />
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
            className="bg-background border border-white/10 rounded-lg px-3 py-1.5 text-text text-xs" />
          <span className="text-text-muted text-xs">—</span>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
            className="bg-background border border-white/10 rounded-lg px-3 py-1.5 text-text text-xs" />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-surface rounded-xl border border-white/5 p-4">
          <div className="flex items-center gap-2 text-text-muted text-xs mb-1">
            <DollarSign className="w-3.5 h-3.5" />
            Total Spend
          </div>
          <div className="text-text font-bold text-lg">{formatRupiah(data.totalSpend)}</div>
        </div>
        <div className="bg-surface rounded-xl border border-white/5 p-4">
          <div className="flex items-center gap-2 text-text-muted text-xs mb-1">
            <ShoppingCart className="w-3.5 h-3.5" />
            Revenue
          </div>
          <div className="text-text font-bold text-lg">{formatRupiah(data.totalRevenue)}</div>
          <div className="text-text-muted text-[10px]">{data.totalOrders} orders</div>
        </div>
        <div className={`bg-surface rounded-xl border p-4 ${isProfitable ? "border-green-500/20" : "border-red-500/20"}`}>
          <div className="flex items-center gap-2 text-text-muted text-xs mb-1">
            {isProfitable ? <TrendingUp className="w-3.5 h-3.5 text-green-400" /> : <TrendingDown className="w-3.5 h-3.5 text-red-400" />}
            Profit/Loss
          </div>
          <div className={`font-bold text-lg ${isProfitable ? "text-green-400" : "text-red-400"}`}>
            {isProfitable ? "+" : ""}{formatRupiah(totalProfit)}
          </div>
        </div>
        <div className="bg-surface rounded-xl border border-white/5 p-4">
          <div className="flex items-center gap-2 text-text-muted text-xs mb-1">
            <TrendingUp className="w-3.5 h-3.5" />
            ROAS
          </div>
          <div className={`font-bold text-lg ${roas >= 2 ? "text-green-400" : roas >= 1 ? "text-yellow-400" : "text-red-400"}`}>
            {roas.toFixed(2)}x
          </div>
          <div className="text-text-muted text-[10px]">{roas >= 2 ? "Profitable" : roas >= 1 ? "Break-even" : "Rugi"}</div>
        </div>
        <div className="bg-surface rounded-xl border border-white/5 p-4">
          <div className="flex items-center gap-2 text-text-muted text-xs mb-1">
            <Target className="w-3.5 h-3.5" />
            CPA
          </div>
          <div className="text-text font-bold text-lg">{formatRupiah(Math.round(cpa))}</div>
          <div className="text-text-muted text-[10px]">Cost per acquisition</div>
        </div>
      </div>

      {/* Per-Platform Breakdown */}
      <div className="bg-surface rounded-xl border border-white/5 p-6">
        <h3 className="text-text font-bold text-sm mb-4">Performa per Platform</h3>
        <div className="space-y-3">
          {Object.entries(data.sourceStats).sort(([, a], [, b]) => b.revenue - a.revenue).map(([source, stats]) => {
            const config = PLATFORM_CONFIG[source] || PLATFORM_CONFIG.other;
            const platformSpend = data.spendByPlatform[source] || 0;
            const platformRoas = platformSpend > 0 ? stats.revenue / platformSpend : 0;
            const platformProfit = stats.revenue - platformSpend;
            const isExpanded = expandedSource === source;

            return (
              <div key={source} className="bg-background rounded-lg border border-white/5">
                <button
                  onClick={() => setExpandedSource(isExpanded ? null : source)}
                  className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <config.icon className={`w-5 h-5 ${config.color}`} />
                    <div className="text-left">
                      <div className="text-text font-medium text-sm">{config.label}</div>
                      <div className="text-text-muted text-[10px]">{stats.orders} orders · {formatRupiah(stats.revenue)} revenue</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className={`font-bold text-sm ${platformProfit >= 0 ? "text-green-400" : "text-red-400"}`}>
                        {platformProfit >= 0 ? "+" : ""}{formatRupiah(platformProfit)}
                      </div>
                      <div className="text-text-muted text-[10px]">
                        Spend: {formatRupiah(platformSpend)} · ROAS: {platformRoas.toFixed(2)}x
                      </div>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-text-muted transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-white/5 pt-3">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-text-muted">
                          <th className="text-left py-1.5 font-medium">Campaign</th>
                          <th className="text-right py-1.5 font-medium">Orders</th>
                          <th className="text-right py-1.5 font-medium">Revenue</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {Object.entries(stats.campaigns).sort(([, a], [, b]) => b.revenue - a.revenue).map(([campaign, cStats]) => (
                          <tr key={campaign}>
                            <td className="py-1.5 text-text">{campaign}</td>
                            <td className="py-1.5 text-text text-right">{cStats.orders}</td>
                            <td className="py-1.5 text-accent text-right font-medium">{formatRupiah(cStats.revenue)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}

          {Object.keys(data.sourceStats).length === 0 && (
            <p className="text-text-muted text-sm text-center py-8">Belum ada order dengan attribution di periode ini</p>
          )}
        </div>
      </div>

      {/* Ad Spend Log */}
      <div className="bg-surface rounded-xl border border-white/5 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-text font-bold text-sm">Ad Spend Log</h3>
          <button
            onClick={() => setShowAddSpend(!showAddSpend)}
            className="flex items-center gap-1.5 text-accent text-xs font-medium hover:opacity-80"
          >
            <Plus className="w-3.5 h-3.5" /> Tambah Spend
          </button>
        </div>

        {/* Add Spend Form */}
        {showAddSpend && (
          <div className="bg-background rounded-lg border border-white/10 p-4 mb-4 space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-text-muted text-[10px] mb-1">Tanggal</label>
                <input type="date" value={spendForm.date} onChange={(e) => setSpendForm({ ...spendForm, date: e.target.value })}
                  className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-text text-xs" />
              </div>
              <div>
                <label className="block text-text-muted text-[10px] mb-1">Platform</label>
                <select value={spendForm.platform} onChange={(e) => setSpendForm({ ...spendForm, platform: e.target.value })}
                  className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-text text-xs">
                  <option value="meta">Meta Ads</option>
                  <option value="google">Google Ads</option>
                  <option value="tiktok">TikTok Ads</option>
                  <option value="other">Lainnya</option>
                </select>
              </div>
              <div>
                <label className="block text-text-muted text-[10px] mb-1">Campaign</label>
                <input type="text" value={spendForm.campaign_name} onChange={(e) => setSpendForm({ ...spendForm, campaign_name: e.target.value })}
                  placeholder="Nama campaign..." className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-text text-xs" />
              </div>
              <div>
                <label className="block text-text-muted text-[10px] mb-1">Spend (Rp)</label>
                <input type="number" value={spendForm.spend} onChange={(e) => setSpendForm({ ...spendForm, spend: e.target.value })}
                  placeholder="100000" className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-text text-xs" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-text-muted text-[10px] mb-1">Impressions</label>
                <input type="number" value={spendForm.impressions} onChange={(e) => setSpendForm({ ...spendForm, impressions: e.target.value })}
                  placeholder="0" className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-text text-xs" />
              </div>
              <div>
                <label className="block text-text-muted text-[10px] mb-1">Clicks</label>
                <input type="number" value={spendForm.clicks} onChange={(e) => setSpendForm({ ...spendForm, clicks: e.target.value })}
                  placeholder="0" className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-text text-xs" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowAddSpend(false)} className="px-4 py-2 text-text-muted text-xs hover:text-text">Batal</button>
              <button onClick={handleAddSpend} disabled={saving || !spendForm.spend}
                className="px-4 py-2 bg-accent text-background rounded-lg text-xs font-medium disabled:opacity-50">
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : "Simpan"}
              </button>
            </div>
          </div>
        )}

        {/* Spend Table */}
        {data.spend.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-text-muted border-b border-white/5">
                  <th className="text-left py-2 font-medium">Tanggal</th>
                  <th className="text-left py-2 font-medium">Platform</th>
                  <th className="text-left py-2 font-medium">Campaign</th>
                  <th className="text-right py-2 font-medium">Spend</th>
                  <th className="text-right py-2 font-medium">Impr.</th>
                  <th className="text-right py-2 font-medium">Clicks</th>
                  <th className="text-right py-2 font-medium">CTR</th>
                  <th className="text-center py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.spend.map((entry) => {
                  const config = PLATFORM_CONFIG[entry.platform] || PLATFORM_CONFIG.other;
                  const ctr = entry.impressions > 0 ? ((entry.clicks / entry.impressions) * 100).toFixed(2) : "—";
                  return (
                    <tr key={entry.id} className="hover:bg-white/[0.02]">
                      <td className="py-2 text-text">{entry.date}</td>
                      <td className="py-2">
                        <span className={`flex items-center gap-1.5 ${config.color}`}>
                          <config.icon className="w-3 h-3" /> {config.label}
                        </span>
                      </td>
                      <td className="py-2 text-text">{entry.campaign_name || "—"}</td>
                      <td className="py-2 text-text text-right font-medium">{formatRupiah(entry.spend)}</td>
                      <td className="py-2 text-text-muted text-right">{entry.impressions.toLocaleString()}</td>
                      <td className="py-2 text-text-muted text-right">{entry.clicks.toLocaleString()}</td>
                      <td className="py-2 text-text-muted text-right">{ctr}{ctr !== "—" ? "%" : ""}</td>
                      <td className="py-2 text-center">
                        <button onClick={() => handleDeleteSpend(entry.id)} className="text-red-400/50 hover:text-red-400">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-text-muted text-sm text-center py-6">Belum ada data ad spend. Klik &quot;Tambah Spend&quot; untuk input manual.</p>
        )}
      </div>

      {/* Tips */}
      <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4">
        <h4 className="text-blue-400 font-medium text-xs mb-2"><Lightbulb className="w-3.5 h-3.5 inline mr-1" />Tips Attribution</h4>
        <ul className="text-text-muted text-[11px] space-y-1">
          <li>• Gunakan UTM parameters di semua link iklan: <code className="text-accent">?utm_source=meta&utm_medium=cpc&utm_campaign=nama_campaign</code></li>
          <li>• ROAS &gt; 2x = profitable, 1-2x = break-even, &lt;1x = rugi</li>
          <li>• Meta CAPI aktif jika Meta Pixel + Access Token sudah diisi di Settings &gt; Pixels</li>
          <li>• Purchase event otomatis terkirim saat pembayaran berhasil (client + server-side)</li>
          <li>• Input spend harian untuk tracking ROI yang akurat</li>
        </ul>
      </div>
    </div>
  );
}
