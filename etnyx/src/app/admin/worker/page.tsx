"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  LogOut, RefreshCw, CheckCircle, Clock, Play, Upload, Send,
  Star, Trophy, Swords, Target, Timer, Camera, ChevronDown, ChevronUp,
  TrendingUp, Package, Loader2, Key, Edit3, Trash2, MessageSquare,
} from "lucide-react";

interface Order {
  id: string;
  order_id: string;
  username: string;
  game_id: string;
  current_rank: string;
  target_rank: string;
  current_star: number | null;
  target_star: number | null;
  package: string;
  package_title: string | null;
  is_express: boolean;
  is_premium: boolean;
  total_price: number;
  status: string;
  progress: number;
  current_progress_rank: string | null;
  created_at: string;
  updated_at: string;
  whatsapp: string | null;
  hero_request: string | null;
  login_method: string | null;
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

interface Credentials {
  order_id: string;
  login_method: string | null;
  account_login: string | null;
  account_password: string | null;
}

interface Note {
  id: string;
  action: string;
  new_value: string;
  notes: string;
  created_by: string;
  created_at: string;
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

const STAR_LABELS: Record<number, string> = { 5: "V", 4: "IV", 3: "III", 2: "II", 1: "I" };
function rankWithStar(rank: string, star?: number | null): string {
  const label = RANK_LABELS[rank] || rank;
  if (star && STAR_LABELS[star]) return `${label} ${STAR_LABELS[star]}`;
  return label;
}

const RANKS_ORDER = ["warrior", "elite", "master", "grandmaster", "epic", "legend", "mythic", "mythicgrading", "mythichonor", "mythicglory", "mythicimmortal"];

export default function WorkerDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<StaffUser | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showAllCompleted, setShowAllCompleted] = useState(false);

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

  // Credentials
  const [credentials, setCredentials] = useState<Record<string, Credentials>>({});
  const [showCredentials, setShowCredentials] = useState<string | null>(null);
  const [loadingCreds, setLoadingCreds] = useState(false);

  // Notes
  const [notesOrder, setNotesOrder] = useState<string | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");
  const [noteSending, setNoteSending] = useState(false);

  // Edit submission
  const [editingSubmission, setEditingSubmission] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    starsGained: 0, mvpCount: 0, savageCount: 0, maniacCount: 0,
    matchesPlayed: 0, winCount: 0, durationMinutes: 0, notes: "",
  });
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

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

  const fetchOrders = useCallback(async (includeCompleted = false) => {
    try {
      const params = includeCompleted ? "?includeCompleted=true" : "";
      const res = await fetch(`/api/staff/orders${params}`);
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

  const fetchCredentials = async (orderId: string) => {
    if (credentials[orderId]) { setShowCredentials(orderId); return; }
    setLoadingCreds(true);
    try {
      const res = await fetch(`/api/staff/credentials?orderId=${orderId}`);
      if (res.ok) {
        const data = await res.json();
        setCredentials(prev => ({ ...prev, [orderId]: data }));
        setShowCredentials(orderId);
      } else {
        alert("Gagal load credentials");
      }
    } catch { alert("Network error"); }
    setLoadingCreds(false);
  };

  const fetchNotes = async (orderId: string) => {
    try {
      const res = await fetch(`/api/staff/notes?orderId=${orderId}`);
      const data = await res.json();
      setNotes(data.notes || []);
    } catch { setNotes([]); }
  };

  const handleAddNote = async (orderId: string) => {
    if (!newNote.trim()) return;
    setNoteSending(true);
    try {
      const res = await fetch("/api/staff/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, message: newNote }),
      });
      if (res.ok) {
        setNewNote("");
        await fetchNotes(orderId);
      }
    } catch { alert("Gagal kirim catatan"); }
    setNoteSending(false);
  };

  const handleEditSubmission = async (submissionId: string) => {
    setEditLoading(true);
    try {
      const res = await fetch("/api/staff/submissions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId,
          starsGained: editForm.starsGained,
          mvpCount: editForm.mvpCount,
          savageCount: editForm.savageCount,
          maniacCount: editForm.maniacCount,
          matchesPlayed: editForm.matchesPlayed,
          winCount: editForm.winCount,
          durationMinutes: editForm.durationMinutes,
          notes: editForm.notes || undefined,
        }),
      });
      if (res.ok) {
        setEditingSubmission(null);
        // Fetch submissions for the order that had this submission
        for (const oid of Object.keys(submissions)) await fetchSubmissions(oid);
        await fetchOrders();
      } else {
        const data = await res.json();
        alert(data.error || "Gagal edit submission");
      }
    } catch { alert("Network error"); }
    setEditLoading(false);
  };

  const handleDeleteSubmission = async (submissionId: string, orderId: string) => {
    if (!confirm("Yakin hapus submission ini?")) return;
    setDeleteLoading(submissionId);
    try {
      const res = await fetch(`/api/staff/submissions?submissionId=${submissionId}`, { method: "DELETE" });
      if (res.ok) {
        await fetchSubmissions(orderId);
        await fetchOrders();
      } else {
        const data = await res.json();
        alert(data.error || "Gagal hapus submission");
      }
    } catch { alert("Network error"); }
    setDeleteLoading(null);
  };

  const isWithin30Min = (date: string) => {
    return (Date.now() - new Date(date).getTime()) < 30 * 60 * 1000;
  };

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
                  credentials={credentials[order.id] || null}
                  showCredentials={showCredentials === order.id}
                  loadingCreds={loadingCreds}
                  onFetchCredentials={() => fetchCredentials(order.id)}
                  onHideCredentials={() => setShowCredentials(null)}
                  notesOrder={notesOrder === order.id}
                  notes={notes}
                  newNote={newNote}
                  setNewNote={setNewNote}
                  noteSending={noteSending}
                  onToggleNotes={() => { setNotesOrder(notesOrder === order.id ? null : order.id); if (notesOrder !== order.id) fetchNotes(order.id); }}
                  onAddNote={() => handleAddNote(order.id)}
                  editingSubmission={editingSubmission}
                  editForm={editForm}
                  setEditForm={setEditForm}
                  editLoading={editLoading}
                  onStartEdit={(s: Submission) => {
                    setEditingSubmission(s.id);
                    setEditForm({
                      starsGained: s.stars_gained, mvpCount: s.mvp_count, savageCount: s.savage_count,
                      maniacCount: s.maniac_count, matchesPlayed: s.matches_played, winCount: s.win_count,
                      durationMinutes: s.duration_minutes, notes: s.notes || "",
                    });
                  }}
                  onCancelEdit={() => setEditingSubmission(null)}
                  onSaveEdit={(id: string) => handleEditSubmission(id)}
                  onDeleteSubmission={(id: string) => handleDeleteSubmission(id, order.id)}
                  deleteLoading={deleteLoading}
                  isWithin30Min={isWithin30Min}
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
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-text font-mono text-sm font-medium">{order.order_id}</span>
                        {order.is_express && <span className="px-1.5 py-0.5 rounded text-xs bg-orange-500/10 text-orange-400">Express</span>}
                      </div>
                      <p className="text-text-muted text-xs mt-1">
                        {order.current_rank === order.target_rank && order.package_title ? order.package_title : `${rankWithStar(order.current_rank, order.current_star)} → ${rankWithStar(order.target_rank, order.target_star)}`}
                      </p>
                      {order.hero_request && <p className="text-text-muted text-xs">Hero: {order.hero_request}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => fetchCredentials(order.id)}
                        disabled={loadingCreds}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/10 text-yellow-400 rounded-lg text-xs hover:bg-yellow-500/20 transition-colors disabled:opacity-50"
                      >
                        {loadingCreds ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Key className="w-3.5 h-3.5" />} Credentials
                      </button>
                      <button
                        onClick={() => handleStartOrder(order.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 gradient-primary rounded-lg text-white text-sm font-medium hover:opacity-90 transition-opacity"
                      >
                        <Play className="w-3.5 h-3.5" /> Mulai
                      </button>
                    </div>
                  </div>
                  {/* Show credentials if expanded */}
                  {showCredentials === order.id && credentials[order.id] && (
                    <div className="mt-3 pt-3 border-t border-white/5 bg-background rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-text font-medium text-xs flex items-center gap-1"><Key className="w-3 h-3 text-yellow-400" /> Login Credentials</h4>
                        <button onClick={() => setShowCredentials(null)} className="text-text-muted text-xs hover:text-text">Tutup</button>
                      </div>
                      {credentials[order.id].login_method && (
                        <div><span className="text-text-muted text-xs">Method:</span><span className="text-text text-xs ml-2 capitalize">{credentials[order.id].login_method}</span></div>
                      )}
                      <div>
                        <span className="text-text-muted text-xs">Login:</span>
                        <p className="bg-surface rounded px-2 py-1 font-mono text-xs text-text break-all mt-0.5">{credentials[order.id].account_login || <span className="text-text-muted italic">N/A</span>}</p>
                      </div>
                      <div>
                        <span className="text-text-muted text-xs">Password:</span>
                        <p className="bg-surface rounded px-2 py-1 font-mono text-xs text-text break-all mt-0.5">{credentials[order.id].account_password || <span className="text-text-muted italic">N/A</span>}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Completed */}
        {completedOrders.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-text font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" /> Selesai ({completedOrders.length})
              </h2>
              {!showAllCompleted && completedOrders.length > 5 && (
                <button onClick={() => { setShowAllCompleted(true); fetchOrders(true); }}
                  className="text-accent text-xs hover:underline">Lihat Semua</button>
              )}
              {showAllCompleted && (
                <button onClick={() => setShowAllCompleted(false)}
                  className="text-text-muted text-xs hover:underline">Tutup</button>
              )}
            </div>
            <div className="space-y-2">
              {(showAllCompleted ? completedOrders : completedOrders.slice(0, 5)).map(order => (
                <div key={order.id} className="bg-surface rounded-xl border border-white/5 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-3">
                  <div className="min-w-0">
                    <span className="text-text font-mono text-sm">{order.order_id}</span>
                    <span className="text-text-muted text-xs ml-2">{order.current_rank === order.target_rank && order.package_title ? order.package_title : `${rankWithStar(order.current_rank, order.current_star)} → ${rankWithStar(order.target_rank, order.target_star)}`}</span>
                  </div>
                  <span className="text-green-400 text-xs shrink-0">{formatDate(order.updated_at)}</span>
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
  // Credentials
  credentials: Credentials | null;
  showCredentials: boolean;
  loadingCreds: boolean;
  onFetchCredentials: () => void;
  onHideCredentials: () => void;
  // Notes
  notesOrder: boolean;
  notes: Note[];
  newNote: string;
  setNewNote: (s: string) => void;
  noteSending: boolean;
  onToggleNotes: () => void;
  onAddNote: () => void;
  // Edit/Delete submission
  editingSubmission: string | null;
  editForm: { starsGained: number; mvpCount: number; savageCount: number; maniacCount: number; matchesPlayed: number; winCount: number; durationMinutes: number; notes: string };
  setEditForm: (f: OrderCardProps["editForm"] | ((prev: OrderCardProps["editForm"]) => OrderCardProps["editForm"])) => void;
  editLoading: boolean;
  onStartEdit: (s: Submission) => void;
  onCancelEdit: () => void;
  onSaveEdit: (id: string) => void;
  onDeleteSubmission: (id: string) => void;
  deleteLoading: string | null;
  isWithin30Min: (date: string) => boolean;
}

function OrderCard({
  order, expanded, onToggle, submissions,
  isSubmitting, onStartSubmission, onCancelSubmission,
  form, setForm, screenshots, uploading, submitting, fileRef,
  onUpload, onRemoveScreenshot, onSubmitResult, onComplete,
  updatingProgress, onToggleProgress, progressValue, setProgressValue,
  progressRank, setProgressRank, onUpdateProgress,
  credentials, showCredentials, loadingCreds, onFetchCredentials, onHideCredentials,
  notesOrder, notes, newNote, setNewNote, noteSending, onToggleNotes, onAddNote,
  editingSubmission, editForm, setEditForm, editLoading, onStartEdit, onCancelEdit, onSaveEdit,
  onDeleteSubmission, deleteLoading, isWithin30Min,
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
              {order.username} • {order.current_rank === order.target_rank && order.package_title ? order.package_title : `${rankWithStar(order.current_rank, order.current_star)} → ${rankWithStar(order.target_rank, order.target_star)}`}
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
            {order.hero_request && (
              <div><span className="text-text-muted text-xs">Hero Request</span><p className="text-text">{order.hero_request}</p></div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <button onClick={onFetchCredentials} disabled={loadingCreds} className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/10 text-yellow-400 rounded-lg text-sm hover:bg-yellow-500/20 transition-colors disabled:opacity-50">
              {loadingCreds ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Key className="w-3.5 h-3.5" />} Credentials
            </button>
            <button onClick={onToggleProgress} className="flex items-center gap-1.5 px-3 py-1.5 bg-accent/10 text-accent rounded-lg text-sm hover:bg-accent/20 transition-colors">
              <TrendingUp className="w-3.5 h-3.5" /> Update Progress
            </button>
            <button onClick={onStartSubmission} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 text-blue-400 rounded-lg text-sm hover:bg-blue-500/20 transition-colors">
              <Send className="w-3.5 h-3.5" /> Submit Hasil
            </button>
            <button onClick={onToggleNotes} className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/10 text-purple-400 rounded-lg text-sm hover:bg-purple-500/20 transition-colors">
              <MessageSquare className="w-3.5 h-3.5" /> Catatan
            </button>
            <button onClick={onComplete} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 text-green-400 rounded-lg text-sm hover:bg-green-500/20 transition-colors">
              <CheckCircle className="w-3.5 h-3.5" /> Selesai
            </button>
          </div>

          {/* Credentials Panel */}
          {showCredentials && credentials && (
            <div className="bg-background rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-text font-medium text-xs flex items-center gap-1"><Key className="w-3 h-3 text-yellow-400" /> Login Credentials</h4>
                <button onClick={onHideCredentials} className="text-text-muted text-xs hover:text-text">Tutup</button>
              </div>
              {credentials.login_method && (
                <div><span className="text-text-muted text-xs">Method:</span><span className="text-text text-xs ml-2 capitalize">{credentials.login_method}</span></div>
              )}
              <div>
                <span className="text-text-muted text-xs">Login:</span>
                <p className="bg-surface rounded px-2 py-1 font-mono text-xs text-text break-all mt-0.5">{credentials.account_login || <span className="text-text-muted italic">N/A</span>}</p>
              </div>
              <div>
                <span className="text-text-muted text-xs">Password:</span>
                <p className="bg-surface rounded px-2 py-1 font-mono text-xs text-text break-all mt-0.5">{credentials.account_password || <span className="text-text-muted italic">N/A</span>}</p>
              </div>
            </div>
          )}

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
                    {editingSubmission === s.id ? (
                      /* Edit Submission Form */
                      <div className="space-y-3">
                        <h5 className="text-text font-medium text-xs">Edit Submission</h5>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <div>
                            <label className="text-text-muted text-[10px]">Stars</label>
                            <input type="number" min={0} value={editForm.starsGained} onChange={(e) => setEditForm(p => ({ ...p, starsGained: Number(e.target.value) }))}
                              className="w-full bg-surface border border-white/10 rounded px-2 py-1 text-text text-xs focus:border-accent focus:outline-none" />
                          </div>
                          <div>
                            <label className="text-text-muted text-[10px]">Matches</label>
                            <input type="number" min={0} value={editForm.matchesPlayed} onChange={(e) => setEditForm(p => ({ ...p, matchesPlayed: Number(e.target.value) }))}
                              className="w-full bg-surface border border-white/10 rounded px-2 py-1 text-text text-xs focus:border-accent focus:outline-none" />
                          </div>
                          <div>
                            <label className="text-text-muted text-[10px]">Wins</label>
                            <input type="number" min={0} value={editForm.winCount} onChange={(e) => setEditForm(p => ({ ...p, winCount: Number(e.target.value) }))}
                              className="w-full bg-surface border border-white/10 rounded px-2 py-1 text-text text-xs focus:border-accent focus:outline-none" />
                          </div>
                          <div>
                            <label className="text-text-muted text-[10px]">MVP</label>
                            <input type="number" min={0} value={editForm.mvpCount} onChange={(e) => setEditForm(p => ({ ...p, mvpCount: Number(e.target.value) }))}
                              className="w-full bg-surface border border-white/10 rounded px-2 py-1 text-text text-xs focus:border-accent focus:outline-none" />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => onSaveEdit(s.id)} disabled={editLoading}
                            className="px-3 py-1 gradient-primary rounded text-white text-xs font-medium disabled:opacity-50 flex items-center gap-1">
                            {editLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />} Simpan
                          </button>
                          <button onClick={onCancelEdit} className="px-3 py-1 bg-surface border border-white/10 rounded text-text-muted text-xs">Batal</button>
                        </div>
                      </div>
                    ) : (
                      /* View Submission */
                      <>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-text-muted">{new Date(s.submitted_at).toLocaleDateString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-accent font-medium">+{s.stars_gained} ★</span>
                            {isWithin30Min(s.submitted_at) && (
                              <>
                                <button onClick={() => onStartEdit(s)} className="text-blue-400 hover:text-blue-300 transition-colors" title="Edit">
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => onDeleteSubmission(s.id)} disabled={deleteLoading === s.id} className="text-red-400 hover:text-red-300 transition-colors" title="Hapus">
                                  {deleteLoading === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                </button>
                              </>
                            )}
                          </div>
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
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes Panel */}
          {notesOrder && (
            <div className="bg-background rounded-lg p-4 space-y-3">
              <h4 className="text-text font-medium text-sm flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-purple-400" /> Catatan Order
              </h4>
              <div className="flex gap-2">
                <input type="text" placeholder="Tulis catatan..." value={newNote} onChange={(e) => setNewNote(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") onAddNote(); }}
                  className="flex-1 bg-surface border border-white/10 rounded-lg px-3 py-2 text-text text-sm focus:border-accent focus:outline-none" />
                <button onClick={onAddNote} disabled={noteSending || !newNote.trim()}
                  className="px-3 py-2 gradient-primary rounded-lg text-white text-sm disabled:opacity-50 flex items-center gap-1">
                  {noteSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {notes.length === 0 && <p className="text-text-muted text-xs text-center py-2">Belum ada catatan</p>}
                {notes.map(n => (
                  <div key={n.id} className="bg-surface rounded-lg p-2.5 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-text font-medium">{n.created_by}</span>
                      <span className="text-text-muted">{new Date(n.created_at).toLocaleDateString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                    <p className="text-text-muted">{n.action === "note" ? n.new_value : `[${n.action}] ${n.new_value}`}</p>
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
