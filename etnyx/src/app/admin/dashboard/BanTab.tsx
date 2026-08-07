"use client";

import { useState, useCallback, useEffect } from "react";
import { toast, toastSuccess, toastError } from "@/components/ToastProvider";
import {
  ShieldBan, Plus, Trash2, RefreshCw, Loader2, Globe, MessageCircle,
  AlertTriangle, Clock, User, Mail, Gamepad2,
} from "lucide-react";

interface BanEntry {
  id: number;
  reason: string;
  auto_banned: boolean;
  banned_by: string;
  created_at: string;
}

interface BannedIP extends BanEntry { ip_address: string; }
interface BannedWhatsApp extends BanEntry { whatsapp: string; }
interface BannedEmail extends BanEntry { email: string; }
interface BannedGameId extends BanEntry { game_id: string; }

type BanType = "ip" | "whatsapp" | "email" | "game_id";

export default function BanTab() {
  const [bannedIps, setBannedIps] = useState<BannedIP[]>([]);
  const [bannedWa, setBannedWa] = useState<BannedWhatsApp[]>([]);
  const [bannedEmails, setBannedEmails] = useState<BannedEmail[]>([]);
  const [bannedGameIds, setBannedGameIds] = useState<BannedGameId[]>([]);
  const [loading, setLoading] = useState(true);
  const [addType, setAddType] = useState<BanType>("ip");
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
      setBannedEmails(data.bannedEmails || []);
      setBannedGameIds(data.bannedGameIds || []);
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
      const typeLabel: Record<BanType, string> = { ip: "IP", whatsapp: "WhatsApp", email: "Email", game_id: "Game ID" };
      toastSuccess(`${typeLabel[addType]} berhasil di-ban`);
      setAddValue(""); setAddReason("");
      fetchBans();
    } catch { toastError("Network error"); }
    setAdding(false);
  };

  const handleRemove = async (type: BanType, value: string) => {
    const typeLabel: Record<BanType, string> = { ip: "IP", whatsapp: "WhatsApp", email: "Email", game_id: "Game ID" };
    if (!confirm(`Unban ${typeLabel[type]}: ${value}?`)) return;
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

  const placeholderFor: Record<BanType, string> = {
    ip: "Contoh: 103.45.67.89",
    whatsapp: "Contoh: +6281234567890",
    email: "Contoh: spammer@gmail.com",
    game_id: "Contoh: 1762073303",
  };

  // Reusable ban table component
  const renderBanTable = <T extends BanEntry>(
    title: string,
    icon: React.ReactNode,
    entries: T[],
    valueKey: keyof T,
    banType: BanType,
    emptyText: React.ReactNode,
  ) => (
    <div className="bg-surface rounded-xl border border-border overflow-hidden">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-text flex items-center gap-2">
          {icon}
          {title} ({entries.length})
        </h3>
      </div>
      {loading ? (
        <div className="p-8 text-center text-text-muted">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
          Loading...
        </div>
      ) : entries.length === 0 ? (
        <div className="p-8 text-center text-text-muted">
          {emptyText}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-background/50">
              <tr className="text-left text-text-muted">
                <th className="px-4 py-3 font-medium">Value</th>
                <th className="px-4 py-3 font-medium">Reason</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Banned By</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {entries.map((entry) => {
                const value = String(entry[valueKey]);
                const rid = `${banType}-${value}`;
                return (
                  <tr key={entry.id} className="hover:bg-background/30 transition-colors">
                    <td className="px-4 py-3 text-text font-mono">{value}</td>
                    <td className="px-4 py-3 text-text-muted max-w-xs truncate" title={entry.reason}>{entry.reason}</td>
                    <td className="px-4 py-3">
                      {entry.auto_banned ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 text-xs font-medium">
                          <AlertTriangle className="w-3 h-3" /> Auto
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 text-xs font-medium">
                          <User className="w-3 h-3" /> Manual
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-text-muted">{entry.banned_by}</td>
                    <td className="px-4 py-3 text-text-muted whitespace-nowrap">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(entry.created_at)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleRemove(banType, value)}
                        disabled={removingId === rid}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50 text-xs font-medium"
                      >
                        {removingId === rid ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Trash2 className="w-3 h-3" />
                        )}
                        Unban
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text flex items-center gap-2">
            <ShieldBan className="w-6 h-6 text-red-500" />
            Ban Management
          </h2>
          <p className="text-text-muted text-sm mt-1">
            Blokir spammer secara permanen — IP, WhatsApp, Email, dan Game ID
          </p>
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
            onChange={(e) => setAddType(e.target.value as BanType)}
            className="px-3 py-2 rounded-lg bg-background border border-border text-text focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="ip">IP Address</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="email">Email</option>
            <option value="game_id">Game ID</option>
          </select>
          <input
            type="text"
            value={addValue}
            onChange={(e) => setAddValue(e.target.value)}
            placeholder={placeholderFor[addType]}
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
              <p className="text-xs text-text-muted">Banned WA</p>
            </div>
          </div>
        </div>
        <div className="bg-surface rounded-xl p-4 border border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <Mail className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text">{bannedEmails.length}</p>
              <p className="text-xs text-text-muted">Banned Emails</p>
            </div>
          </div>
        </div>
        <div className="bg-surface rounded-xl p-4 border border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Gamepad2 className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text">{bannedGameIds.length}</p>
              <p className="text-xs text-text-muted">Banned Game IDs</p>
            </div>
          </div>
        </div>
      </div>

      {/* Ban Tables */}
      {renderBanTable(
        "Banned IP Addresses",
        <Globe className="w-5 h-5 text-red-500" />,
        bannedIps, "ip_address", "ip",
        <><Globe className="w-8 h-8 mx-auto mb-2 opacity-30" /> Tidak ada IP yang di-banned</>,
      )}
      {renderBanTable(
        "Banned WhatsApp Numbers",
        <MessageCircle className="w-5 h-5 text-orange-500" />,
        bannedWa, "whatsapp", "whatsapp",
        <><MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-30" /> Tidak ada WhatsApp yang di-banned</>,
      )}
      {renderBanTable(
        "Banned Emails",
        <Mail className="w-5 h-5 text-yellow-500" />,
        bannedEmails, "email", "email",
        <><Mail className="w-8 h-8 mx-auto mb-2 opacity-30" /> Tidak ada Email yang di-banned</>,
      )}
      {renderBanTable(
        "Banned Game IDs",
        <Gamepad2 className="w-5 h-5 text-purple-500" />,
        bannedGameIds, "game_id", "game_id",
        <><Gamepad2 className="w-8 h-8 mx-auto mb-2 opacity-30" /> Tidak ada Game ID yang di-banned</>,
      )}
    </div>
  );
}