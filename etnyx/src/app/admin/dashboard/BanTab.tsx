"use client";

import { useState, useCallback, useEffect } from "react";
import { toast, toastSuccess, toastError } from "@/components/ToastProvider";
import {
  ShieldBan, Plus, Trash2, RefreshCw, Loader2, Globe, MessageCircle,
  AlertTriangle, Clock, User,
} from "lucide-react";

interface BannedIP {
  id: number;
  ip_address: string;
  reason: string;
  auto_banned: boolean;
  banned_by: string;
  created_at: string;
}

interface BannedWhatsApp {
  id: number;
  whatsapp: string;
  reason: string;
  auto_banned: boolean;
  banned_by: string;
  created_at: string;
}

export default function BanTab() {
  const [bannedIps, setBannedIps] = useState<BannedIP[]>([]);
  const [bannedWa, setBannedWa] = useState<BannedWhatsApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [addType, setAddType] = useState<"ip" | "whatsapp">("ip");
  const [addValue, setAddValue] = useState("");
  const [addReason, setAddReason] = useState("");
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const fetchBans = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/banned-ips");
      if (!res.ok) { toastError("Gagal memuat data ban list"); return; }
      const data = await res.json();
      setBannedIps(data.bannedIps || []);
      setBannedWa(data.bannedWhatsapp || []);
    } catch { toastError("Network error"); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchBans(); }, [fetchBans]);

  const handleAdd = async () => {
    if (!addValue.trim()) { toast("Value tidak boleh kosong"); return; }
    setAdding(true);
    try {
      const res = await fetch("/api/admin/banned-ips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: addType, value: addValue.trim(), reason: addReason.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { toastError(data.error || "Gagal menambahkan ban"); return; }
      toastSuccess(`${addType === "ip" ? "IP" : "WhatsApp"} berhasil di-ban`);
      setAddValue(""); setAddReason("");
      fetchBans();
    } catch { toastError("Network error"); }
    setAdding(false);
  };

  const handleRemove = async (type: "ip" | "whatsapp", value: string) => {
    if (!confirm(`Unban ${type === "ip" ? "IP" : "WhatsApp"}: ${value}?`)) return;
    setRemovingId(`${type}-${value}`);
    try {
      const res = await fetch(`/api/admin/banned-ips?type=${type}&value=${encodeURIComponent(value)}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) { toastError(data.error || "Gagal unban"); return; }
      toastSuccess("Berhasil di-unban");
      fetchBans();
    } catch { toastError("Network error"); }
    setRemovingId(null);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text flex items-center gap-2">
            <ShieldBan className="w-6 h-6 text-red-500" />
            Ban Management
          </h2>
          <p className="text-text-muted text-sm mt-1">Kelola IP dan nomor WhatsApp yang di-banned</p>
        </div>
        <button
          onClick={fetchBans}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface hover:bg-surface-hover text-text transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Add Ban Form */}
      <div className="bg-surface rounded-xl p-5 border border-border">
        <h3 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-green-500" />
          Tambah Ban Manual
        </h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={addType}
            onChange={(e) => setAddType(e.target.value as "ip" | "whatsapp")}
            className="px-3 py-2 rounded-lg bg-background border border-border text-text focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="ip">IP Address</option>
            <option value="whatsapp">WhatsApp</option>
          </select>
          <input
            type="text"
            value={addValue}
            onChange={(e) => setAddValue(e.target.value)}
            placeholder={addType === "ip" ? "Contoh: 103.45.67.89" : "Contoh: +6281234567890"}
            className="flex-1 px-3 py-2 rounded-lg bg-background border border-border text-text focus:outline-none focus:ring-2 focus:ring-primary"
            onKeyDown={(e) => { if (e.key === "Enter" && !adding) handleAdd(); }}
          />
          <input
            type="text"
            value={addReason}
            onChange={(e) => setAddReason(e.target.value)}
            placeholder="Alasan (opsional)"
            className="flex-1 px-3 py-2 rounded-lg bg-background border border-border text-text focus:outline-none focus:ring-2 focus:ring-primary"
            onKeyDown={(e) => { if (e.key === "Enter" && !adding) handleAdd(); }}
          />
          <button
            onClick={handleAdd}
            disabled={adding || !addValue.trim()}
            className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Ban
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-surface rounded-xl p-4 border border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
              <Globe className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text">{bannedIps.length}</p>
              <p className="text-xs text-text-muted">Banned IPs</p>
            </div>
          </div>
        </div>
        <div className="bg-surface rounded-xl p-4 border border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text">{bannedWa.length}</p>
              <p className="text-xs text-text-muted">Banned WhatsApp</p>
            </div>
          </div>
        </div>
      </div>

      {/* Banned IPs Table */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold text-text flex items-center gap-2">
            <Globe className="w-5 h-5 text-red-500" />
            Banned IP Addresses ({bannedIps.length})
          </h3>
        </div>
        {loading ? (
          <div className="p-8 text-center text-text-muted">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
            Loading...
          </div>
        ) : bannedIps.length === 0 ? (
          <div className="p-8 text-center text-text-muted">
            <Globe className="w-8 h-8 mx-auto mb-2 opacity-30" />
            Tidak ada IP yang di-banned
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-background/50">
                <tr className="text-left text-text-muted">
                  <th className="px-4 py-3 font-medium">IP Address</th>
                  <th className="px-4 py-3 font-medium">Reason</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Banned By</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {bannedIps.map((ip) => (
                  <tr key={ip.id} className="hover:bg-background/30 transition-colors">
                    <td className="px-4 py-3 text-text font-mono">{ip.ip_address}</td>
                    <td className="px-4 py-3 text-text-muted max-w-xs truncate" title={ip.reason}>{ip.reason}</td>
                    <td className="px-4 py-3">
                      {ip.auto_banned ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 text-xs font-medium">
                          <AlertTriangle className="w-3 h-3" /> Auto
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 text-xs font-medium">
                          <User className="w-3 h-3" /> Manual
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-text-muted">{ip.banned_by}</td>
                    <td className="px-4 py-3 text-text-muted whitespace-nowrap">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(ip.created_at)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleRemove("ip", ip.ip_address)}
                        disabled={removingId === `ip-${ip.ip_address}`}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50 text-xs font-medium"
                      >
                        {removingId === `ip-${ip.ip_address}` ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Trash2 className="w-3 h-3" />
                        )}
                        Unban
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Banned WhatsApp Table */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold text-text flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-orange-500" />
            Banned WhatsApp Numbers ({bannedWa.length})
          </h3>
        </div>
        {loading ? (
          <div className="p-8 text-center text-text-muted">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
            Loading...
          </div>
        ) : bannedWa.length === 0 ? (
          <div className="p-8 text-center text-text-muted">
            <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
            Tidak ada WhatsApp yang di-banned
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-background/50">
                <tr className="text-left text-text-muted">
                  <th className="px-4 py-3 font-medium">WhatsApp Number</th>
                  <th className="px-4 py-3 font-medium">Reason</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Banned By</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {bannedWa.map((wa) => (
                  <tr key={wa.id} className="hover:bg-background/30 transition-colors">
                    <td className="px-4 py-3 text-text font-mono">{wa.whatsapp}</td>
                    <td className="px-4 py-3 text-text-muted max-w-xs truncate" title={wa.reason}>{wa.reason}</td>
                    <td className="px-4 py-3">
                      {wa.auto_banned ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 text-xs font-medium">
                          <AlertTriangle className="w-3 h-3" /> Auto
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 text-xs font-medium">
                          <User className="w-3 h-3" /> Manual
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-text-muted">{wa.banned_by}</td>
                    <td className="px-4 py-3 text-text-muted whitespace-nowrap">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(wa.created_at)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleRemove("whatsapp", wa.whatsapp)}
                        disabled={removingId === `whatsapp-${wa.whatsapp}`}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50 text-xs font-medium"
                      >
                        {removingId === `whatsapp-${wa.whatsapp}` ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Trash2 className="w-3 h-3" />
                        )}
                        Unban
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}