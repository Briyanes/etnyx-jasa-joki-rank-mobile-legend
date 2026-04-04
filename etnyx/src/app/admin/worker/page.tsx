"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  LogOut, RefreshCw, CheckCircle, Clock, Play, Upload, Send,
  Star, Trophy, Swords, Target, Timer, Camera, ChevronDown, ChevronUp,
  TrendingUp, Package, Loader2,
} from "lucide-react";

interface Order {
  id: string;
  order_id: string;
  username: string;
  game_id: string;
  current_rank: string;
  target_rank: string;
  package: string;
  is_express: boolean;
  is_premium: boolean;
  total_price: number;
  status: string;
  progress: number;
  current_progress_rank: string | null;
  created_at: string;
  whatsapp: string | null;
}

interface Submission {
  id: string;
  order_id: string;
  stars_gained: number;
  mvp_count: number;
  savage_count: number;
  maniac_count: number;
  matches_played: number;
  win_count: number;
  duration_minutes: number;
  screenshots: string[];
  notes: string | null;
  submitted_at: string;
}

interface StaffUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

const RANK_LABELS: Record<string, string> = {
  warrior: "Warrior", elite: "Elite", master: "Master", grandmaster: "Grandmaster",
  epic: "Epic", legend: "Legend", mythic: "Mythic", mythicgrading: "Mythic Grading",
  mythichonor: "Mythic Honor", mythicglory: "Mythic Glory", mythicimmortal: "Mythic Immortal",
};

const RANKS_ORDER = ["warrior", "elite", "master", "grandmaster", "epic", "legend", "mythic", "mythicgrading", "mythichonor", "mythicglory", "mythicimmortal"];

export default function WorkerDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<StaffUser | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Submission form
  const [submittingOrder, setSubmittingOrder] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<Record<string, Submission[]>>({});
  const [form, setForm] = useState({
    starsGained: 0, mvpCount: 0, savageCount: 0, maniacCount: 0,
    matchesPlayed: 0, winCount: 0, durationMinutes: 0, notes: "",
  });
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Progress update
  const [updatingProgress, setUpdatingProgress] = useState<string | null>(null);
  const [progressValue, setProgressValue] = useState(0);
  const [progressRank, setProgressRank] = useState("");

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/staff/auth");
      if (!res.ok) { router.push("/admin"); return null; }
      const data = await res.json();
      if (data.user.role !== "worker") {
        router.push("/admin"); return null;
      }
      return data.user;
    } catch { router.push("/admin"); return null; }
  }, [router]);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/staff/orders");
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (e) { console.error(e); }
  }, []);

  const fetchSubmissions = useCallback(async (orderId: string) => {
    try {
      const res = await fetch(`/api/staff/submissions?orderId=${orderId}`);
      const data = await res.json();
      setSubmissions(prev => ({ ...prev, [orderId]: data.submissions || [] }));
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    (async () => {
      const user = await checkAuth();
      if (user) {
        setCurrentUser(user);
        await fetchOrders();
      }
      setLoading(false);
    })();
  }, [checkAuth, fetchOrders]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    await fetch("/api/staff/auth", { method: "DELETE" });
    router.push("/admin");
  };

  const handleStartOrder = async (orderId: string) => {
    try {
      const res = await fetch("/api/staff/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: "in_progress" }),
      });
      if (res.ok) await fetchOrders();
    } catch { alert("Gagal update status"); }
  };

  const handleUpdateProgress = async (orderId: string) => {
    try {
      const res = await fetch("/api/staff/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, progress: progressValue, currentProgressRank: progressRank || undefined }),
      });
      if (res.ok) {
        setUpdatingProgress(null);
        await fetchOrders();
      }
    } catch { alert("Gagal update progress"); }
  };

  const handleCompleteOrder = async (orderId: string) => {
    if (!confirm("Yakin order ini sudah selesai?")) return;
    try {
      const res = await fetch("/api/staff/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: "completed", progress: 100 }),
      });
      if (res.ok) await fetchOrders();
    } catch { alert("Gagal update status"); }
  };

  const handleUploadScreenshot = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/staff/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok && data.url) {
        setScreenshots(prev => [...prev, data.url]);
      } else {
        alert(data.error || "Upload gagal");
      }
    } catch { alert("Upload gagal"); }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSubmitResult = async (orderId: string) => {
    if (form.matchesPlayed === 0) { alert("Isi jumlah match yang dimainkan"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/staff/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          starsGained: form.starsGained,
          mvpCount: form.mvpCount,
          savageCount: form.savageCount,
          maniacCount: form.maniacCount,
          matchesPlayed: form.matchesPlayed,
          winCount: form.winCount,
          durationMinutes: form.durationMinutes,
          screenshots,
          notes: form.notes || undefined,
        }),
      });
      if (res.ok) {
        setSubmittingOrder(null);
        setForm({ starsGained: 0, mvpCount: 0, savageCount: 0, maniacCount: 0, matchesPlayed: 0, winCount: 0, durationMinutes: 0, notes: "" });
        setScreenshots([]);
        await fetchOrders();
        await fetchSubmissions(orderId);
      } else {
        const data = await res.json();
        alert(data.error || "Gagal submit");
      }
    } catch { alert("Network error"); }
    setSubmitting(false);
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

  const activeOrders = orders.filter(o => o.status === "in_progress");
  const pendingOrders = orders.filter(o => o.status !== "in_progress" && o.status !== "completed");
  const completedOrders = orders.filter(o => o.status === "completed");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Image src="/logo/circle-landscape.webp" alt="ETNYX" width={140} height={40} priority />
          <div className="mt-6 w-48 h-1.5 bg-surface rounded-full overflow-hidden mx-auto">
            <div className="h-full gradient-primary rounded-full animate-[loading_1.5s_ease-in-out_infinite]" style={{ width: "60%" }} />
          </div>
          <p className="text-text-muted text-sm mt-3">Loading Worker Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-surface border-b border-white/5 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/logo/circle-landscape.webp" alt="ETNYX" width={120} height={35} />
            <span className="px-2 py-0.5 text-xs rounded-md bg-green-500/10 text-green-400 font-medium">WORKER</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-text-muted text-sm hidden sm:block">{currentUser?.name}</span>
            <button onClick={handleRefresh} disabled={refreshing} className="p-2 text-text-muted hover:text-text transition-colors">
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            </button>
            <button onClick={handleLogout} className="p-2 text-text-muted hover:text-red-400 transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-surface rounded-xl p-4 border border-white/5 text-center">
            <Clock className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
            <p className="text-xl font-bold text-text">{pendingOrders.length}</p>
            <p className="text-text-muted text-xs">Menunggu</p>
          </div>
          <div className="bg-surface rounded-xl p-4 border border-accent/20 text-center">
            <TrendingUp className="w-5 h-5 text-accent mx-auto mb-1" />
            <p className="text-xl font-bold text-accent">{activeOrders.length}</p>
            <p className="text-text-muted text-xs">Aktif</p>
          </div>
          <div className="bg-surface rounded-xl p-4 border border-green-500/20 text-center">
            <CheckCircle className="w-5 h-5 text-green-400 mx-auto mb-1" />
            <p className="text-xl font-bold text-green-400">{completedOrders.length}</p>
            <p className="text-text-muted text-xs">Selesai</p>
          </div>
        </div>

        {/* Active Orders */}
        {activeOrders.length > 0 && (
          <section>
            <h2 className="text-text font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-accent" /> Order Aktif
            </h2>
            <div className="space-y-3">
              {activeOrders.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  expanded={expandedOrder === order.id}
                  onToggle={() => {
                    const next = expandedOrder === order.id ? null : order.id;
                    setExpandedOrder(next);
                    if (next) fetchSubmissions(order.id);
                  }}
                  submissions={submissions[order.id] || []}
                  isSubmitting={submittingOrder === order.id}
                  onStartSubmission={() => setSubmittingOrder(order.id)}
                  onCancelSubmission={() => { setSubmittingOrder(null); setScreenshots([]); }}
                  form={form}
                  setForm={setForm}
                  screenshots={screenshots}
                  uploading={uploading}
                  submitting={submitting}
                  fileRef={fileRef}
                  onUpload={handleUploadScreenshot}
                  onRemoveScreenshot={(i) => setScreenshots(prev => prev.filter((_, idx) => idx !== i))}
                  onSubmitResult={() => handleSubmitResult(order.id)}
                  onComplete={() => handleCompleteOrder(order.id)}
                  updatingProgress={updatingProgress === order.id}
                  onToggleProgress={() => {
                    if (updatingProgress === order.id) {
                      setUpdatingProgress(null);
                    } else {
                      setUpdatingProgress(order.id);
                      setProgressValue(order.progress || 0);
                      setProgressRank(order.current_progress_rank || "");
                    }
                  }}
                  progressValue={progressValue}
                  setProgressValue={setProgressValue}
                  progressRank={progressRank}
                  setProgressRank={setProgressRank}
                  onUpdateProgress={() => handleUpdateProgress(order.id)}
                  active
                />
              ))}
            </div>
          </section>
        )}

        {/* Pending Orders */}
        {pendingOrders.length > 0 && (
          <section>
            <h2 className="text-text font-semibold mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-400" /> Order Menunggu
            </h2>
            <div className="space-y-3">
              {pendingOrders.map(order => (
                <div key={order.id} className="bg-surface rounded-xl border border-white/5 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-text font-mono text-sm font-medium">{order.order_id}</span>
                        {order.is_express && <span className="px-1.5 py-0.5 rounded text-xs bg-orange-500/10 text-orange-400">Express</span>}
                      </div>
                      <p className="text-text-muted text-xs mt-1">
                        {RANK_LABELS[order.current_rank] || order.current_rank} → {RANK_LABELS[order.target_rank] || order.target_rank}
                      </p>
                    </div>
                    <button
                      onClick={() => handleStartOrder(order.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 gradient-primary rounded-lg text-white text-sm font-medium hover:opacity-90 transition-opacity"
                    >
                      <Play className="w-3.5 h-3.5" /> Mulai
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Completed */}
        {completedOrders.length > 0 && (
          <section>
            <h2 className="text-text font-semibold mb-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" /> Selesai
            </h2>
            <div className="space-y-2">
              {completedOrders.slice(0, 10).map(order => (
                <div key={order.id} className="bg-surface rounded-xl border border-white/5 p-3 flex items-center justify-between">
                  <div>
                    <span className="text-text font-mono text-sm">{order.order_id}</span>
                    <span className="text-text-muted text-xs ml-2">{RANK_LABELS[order.current_rank]} → {RANK_LABELS[order.target_rank]}</span>
                  </div>
                  <span className="text-green-400 text-xs">{formatDate(order.created_at)}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {orders.length === 0 && (
          <div className="text-center py-16">
            <Package className="w-12 h-12 text-text-muted mx-auto mb-3" />
            <p className="text-text-muted">Belum ada order ditugaskan</p>
            <p className="text-text-muted text-sm mt-1">Lead akan assign order ke kamu</p>
          </div>
        )}
      </main>
    </div>
  );
}

// ---- Order Card Component ----

interface OrderCardProps {
  order: Order;
  expanded: boolean;
  onToggle: () => void;
  submissions: Submission[];
  isSubmitting: boolean;
  onStartSubmission: () => void;
  onCancelSubmission: () => void;
  form: { starsGained: number; mvpCount: number; savageCount: number; maniacCount: number; matchesPlayed: number; winCount: number; durationMinutes: number; notes: string };
  setForm: (f: typeof OrderCard extends never ? never : OrderCardProps["form"] | ((prev: OrderCardProps["form"]) => OrderCardProps["form"])) => void;
  screenshots: string[];
  uploading: boolean;
  submitting: boolean;
  fileRef: React.RefObject<HTMLInputElement | null>;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveScreenshot: (i: number) => void;
  onSubmitResult: () => void;
  onComplete: () => void;
  updatingProgress: boolean;
  onToggleProgress: () => void;
  progressValue: number;
  setProgressValue: (n: number) => void;
  progressRank: string;
  setProgressRank: (s: string) => void;
  onUpdateProgress: () => void;
  active: boolean;
}

function OrderCard({
  order, expanded, onToggle, submissions,
  isSubmitting, onStartSubmission, onCancelSubmission,
  form, setForm, screenshots, uploading, submitting, fileRef,
  onUpload, onRemoveScreenshot, onSubmitResult, onComplete,
  updatingProgress, onToggleProgress, progressValue, setProgressValue,
  progressRank, setProgressRank, onUpdateProgress,
}: OrderCardProps) {
  return (
    <div className="bg-surface rounded-xl border border-accent/20 overflow-hidden">
      {/* Order Header */}
      <div className="p-4 cursor-pointer" onClick={onToggle}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-text font-mono text-sm font-medium">{order.order_id}</span>
              {order.is_express && <span className="px-1.5 py-0.5 rounded text-xs bg-orange-500/10 text-orange-400">Express</span>}
              {order.is_premium && <span className="px-1.5 py-0.5 rounded text-xs bg-purple-500/10 text-purple-400">Premium</span>}
            </div>
            <p className="text-text-muted text-xs mt-1">
              {order.username} • {RANK_LABELS[order.current_rank] || order.current_rank} → {RANK_LABELS[order.target_rank] || order.target_rank}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-accent text-sm font-medium">{order.progress || 0}%</p>
            </div>
            {expanded ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-3 h-2 bg-background rounded-full overflow-hidden">
          <div className="h-full gradient-primary rounded-full transition-all duration-500" style={{ width: `${order.progress || 0}%` }} />
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-white/5 pt-4">
          {/* Order Details */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-text-muted text-xs">Game ID</span><p className="text-text">{order.game_id}</p></div>
            <div><span className="text-text-muted text-xs">Package</span><p className="text-text capitalize">{order.package}</p></div>
            {order.current_progress_rank && (
              <div><span className="text-text-muted text-xs">Rank Saat Ini</span><p className="text-text">{RANK_LABELS[order.current_progress_rank] || order.current_progress_rank}</p></div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <button onClick={onToggleProgress} className="flex items-center gap-1.5 px-3 py-1.5 bg-accent/10 text-accent rounded-lg text-sm hover:bg-accent/20 transition-colors">
              <TrendingUp className="w-3.5 h-3.5" /> Update Progress
            </button>
            <button onClick={onStartSubmission} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 text-blue-400 rounded-lg text-sm hover:bg-blue-500/20 transition-colors">
              <Send className="w-3.5 h-3.5" /> Submit Hasil
            </button>
            <button onClick={onComplete} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 text-green-400 rounded-lg text-sm hover:bg-green-500/20 transition-colors">
              <CheckCircle className="w-3.5 h-3.5" /> Selesai
            </button>
          </div>

          {/* Update Progress Form */}
          {updatingProgress && (
            <div className="bg-background rounded-lg p-3 space-y-3">
              <div>
                <label className="text-text-muted text-xs">Progress (%)</label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={progressValue}
                  onChange={(e) => setProgressValue(Number(e.target.value))}
                  className="w-full mt-1 accent-[var(--accent)]"
                />
                <p className="text-text text-sm text-center">{progressValue}%</p>
              </div>
              <div>
                <label className="text-text-muted text-xs">Rank Sekarang</label>
                <select
                  value={progressRank}
                  onChange={(e) => setProgressRank(e.target.value)}
                  className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-text text-sm focus:border-accent focus:outline-none mt-1"
                >
                  <option value="">Pilih rank...</option>
                  {RANKS_ORDER.map(r => (
                    <option key={r} value={r}>{RANK_LABELS[r]}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button onClick={onUpdateProgress} className="px-3 py-1.5 gradient-primary rounded-lg text-white text-sm font-medium hover:opacity-90">Simpan</button>
                <button onClick={onToggleProgress} className="px-3 py-1.5 bg-surface border border-white/10 rounded-lg text-text-muted text-sm">Batal</button>
              </div>
            </div>
          )}

          {/* Submit Result Form */}
          {isSubmitting && (
            <div className="bg-background rounded-lg p-4 space-y-4">
              <h4 className="text-text font-medium text-sm">Submit Hasil Match</h4>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-text-muted text-xs flex items-center gap-1"><Star className="w-3 h-3" /> Stars</label>
                  <input type="number" min={0} value={form.starsGained} onChange={(e) => setForm(p => ({ ...p, starsGained: Number(e.target.value) }))}
                    className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-text text-sm mt-1 focus:border-accent focus:outline-none" />
                </div>
                <div>
                  <label className="text-text-muted text-xs flex items-center gap-1"><Trophy className="w-3 h-3" /> MVP</label>
                  <input type="number" min={0} value={form.mvpCount} onChange={(e) => setForm(p => ({ ...p, mvpCount: Number(e.target.value) }))}
                    className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-text text-sm mt-1 focus:border-accent focus:outline-none" />
                </div>
                <div>
                  <label className="text-text-muted text-xs flex items-center gap-1"><Swords className="w-3 h-3" /> Savage</label>
                  <input type="number" min={0} value={form.savageCount} onChange={(e) => setForm(p => ({ ...p, savageCount: Number(e.target.value) }))}
                    className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-text text-sm mt-1 focus:border-accent focus:outline-none" />
                </div>
                <div>
                  <label className="text-text-muted text-xs flex items-center gap-1"><Target className="w-3 h-3" /> Maniac</label>
                  <input type="number" min={0} value={form.maniacCount} onChange={(e) => setForm(p => ({ ...p, maniacCount: Number(e.target.value) }))}
                    className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-text text-sm mt-1 focus:border-accent focus:outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-text-muted text-xs flex items-center gap-1"><Swords className="w-3 h-3" /> Matches</label>
                  <input type="number" min={0} value={form.matchesPlayed} onChange={(e) => setForm(p => ({ ...p, matchesPlayed: Number(e.target.value) }))}
                    className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-text text-sm mt-1 focus:border-accent focus:outline-none" />
                </div>
                <div>
                  <label className="text-text-muted text-xs flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Wins</label>
                  <input type="number" min={0} value={form.winCount} onChange={(e) => setForm(p => ({ ...p, winCount: Number(e.target.value) }))}
                    className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-text text-sm mt-1 focus:border-accent focus:outline-none" />
                </div>
                <div>
                  <label className="text-text-muted text-xs flex items-center gap-1"><Timer className="w-3 h-3" /> Menit</label>
                  <input type="number" min={0} value={form.durationMinutes} onChange={(e) => setForm(p => ({ ...p, durationMinutes: Number(e.target.value) }))}
                    className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-text text-sm mt-1 focus:border-accent focus:outline-none" />
                </div>
              </div>

              {/* Screenshots */}
              <div>
                <label className="text-text-muted text-xs flex items-center gap-1 mb-2"><Camera className="w-3 h-3" /> Screenshots</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {screenshots.map((url, i) => (
                    <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-white/10">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button onClick={() => onRemoveScreenshot(i)} className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs flex items-center justify-center rounded-bl">×</button>
                    </div>
                  ))}
                </div>
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={onUpload} className="hidden" />
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-white/10 rounded-lg text-text-muted text-sm hover:text-text transition-colors disabled:opacity-50"
                >
                  {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  {uploading ? "Uploading..." : "Upload Screenshot"}
                </button>
              </div>

              {/* Notes */}
              <div>
                <label className="text-text-muted text-xs">Catatan</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))}
                  rows={2}
                  placeholder="Catatan tambahan..."
                  className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-text text-sm mt-1 focus:border-accent focus:outline-none resize-none"
                />
              </div>

              <div className="flex gap-2">
                <button onClick={onSubmitResult} disabled={submitting} className="flex items-center gap-1.5 px-4 py-2 gradient-primary rounded-lg text-white text-sm font-medium hover:opacity-90 disabled:opacity-50">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {submitting ? "Mengirim..." : "Submit"}
                </button>
                <button onClick={onCancelSubmission} className="px-4 py-2 bg-surface border border-white/10 rounded-lg text-text-muted text-sm">Batal</button>
              </div>
            </div>
          )}

          {/* Previous Submissions */}
          {submissions.length > 0 && (
            <div>
              <h4 className="text-text-muted text-xs font-medium mb-2">Riwayat Submission</h4>
              <div className="space-y-2">
                {submissions.map(s => (
                  <div key={s.id} className="bg-background rounded-lg p-3 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-text-muted">{new Date(s.submitted_at).toLocaleDateString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                      <span className="text-accent font-medium">+{s.stars_gained} ★</span>
                    </div>
                    <div className="flex gap-3 text-text-muted">
                      <span>{s.matches_played} match</span>
                      <span>{s.win_count}W</span>
                      {s.mvp_count > 0 && <span>{s.mvp_count} MVP</span>}
                      {s.savage_count > 0 && <span>{s.savage_count} Savage</span>}
                    </div>
                    {s.screenshots.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {s.screenshots.map((url, i) => (
                          <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded overflow-hidden border border-white/10">
                            <img src={url} alt="" className="w-full h-full object-cover" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
