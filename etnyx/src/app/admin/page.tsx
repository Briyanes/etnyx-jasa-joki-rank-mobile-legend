"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { LogIn, Eye, EyeOff, ArrowLeft, Mail, Loader2, CheckCircle } from "lucide-react";

function AdminLoginContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Forgot password state
  const [mode, setMode] = useState<"login" | "forgot" | "reset">("login");
  const [resetEmail, setResetEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState("");

  useEffect(() => {
    const token = searchParams.get("reset");
    if (token) {
      setResetToken(token);
      setMode("reset");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/staff/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase().trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login gagal");
        return;
      }

      switch (data.user.role) {
        case "admin": router.push("/admin/dashboard"); break;
        case "lead": router.push("/admin/lead"); break;
        case "worker": router.push("/admin/worker"); break;
        default: router.push("/admin/dashboard");
      }
    } catch {
      setError("Network error. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setError("");
    setResetSuccess("");

    try {
      const res = await fetch("/api/staff/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail.toLowerCase().trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setResetSuccess(data.message || "Link reset telah dikirim ke email kamu");
      } else {
        setError(data.error || "Gagal mengirim reset link");
      }
    } catch {
      setError("Network error. Coba lagi.");
    } finally {
      setResetLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) { setError("Password minimal 8 karakter"); return; }
    setResetLoading(true);
    setError("");
    setResetSuccess("");

    try {
      const res = await fetch("/api/staff/reset-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: resetToken, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setResetSuccess("Password berhasil di-reset. Silakan login.");
        setTimeout(() => { setMode("login"); setResetSuccess(""); }, 3000);
      } else {
        setError(data.error || "Gagal reset password");
      }
    } catch {
      setError("Network error. Coba lagi.");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <Image
              src="/logo/circle-landscape.webp"
              alt="ETNYX Logo"
              width={180}
              height={50}
              priority
            />
          </div>
          <h1 className="text-xl font-semibold text-text">Staff Portal</h1>
          <p className="text-text-muted text-sm mt-1">Login untuk mengakses dashboard</p>
        </div>

        {/* Form Card */}
        <div className="bg-surface rounded-2xl p-6 border border-white/5">
          {/* Error / Success Messages */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm mb-4">
              {error}
            </div>
          )}
          {resetSuccess && (
            <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-xl text-sm mb-4 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" /> {resetSuccess}
            </div>
          )}

          {mode === "login" && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm text-text-muted mb-2">Email</label>
                <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-text focus:border-accent focus:outline-none transition-colors"
                  placeholder="email@etnyx.com" required />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm text-text-muted mb-2">Password</label>
                <div className="relative">
                  <input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 pr-12 text-text focus:border-accent focus:outline-none transition-colors"
                    placeholder="••••••••" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full gradient-primary py-3.5 rounded-xl text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><LogIn className="w-5 h-5" /> Login</>}
              </button>
              <button type="button" onClick={() => { setMode("forgot"); setError(""); setResetSuccess(""); }}
                className="w-full text-text-muted text-sm hover:text-accent transition-colors py-1">
                Lupa password?
              </button>
            </form>
          )}

          {mode === "forgot" && (
            <form onSubmit={handleForgotPassword} className="space-y-5">
              <div className="flex items-center gap-2 mb-2">
                <button type="button" onClick={() => { setMode("login"); setError(""); setResetSuccess(""); }} className="text-text-muted hover:text-text transition-colors">
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h2 className="text-text font-semibold text-sm">Lupa Password</h2>
              </div>
              <p className="text-text-muted text-xs">Masukkan email kamu, kami akan kirim link untuk reset password.</p>
              <div>
                <label htmlFor="resetEmail" className="block text-sm text-text-muted mb-2">Email</label>
                <input id="resetEmail" type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-text focus:border-accent focus:outline-none transition-colors"
                  placeholder="email@etnyx.com" required />
              </div>
              <button type="submit" disabled={resetLoading}
                className="w-full gradient-primary py-3.5 rounded-xl text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
                {resetLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Mail className="w-5 h-5" /> Kirim Link Reset</>}
              </button>
            </form>
          )}

          {mode === "reset" && (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <h2 className="text-text font-semibold text-sm">Reset Password</h2>
              <p className="text-text-muted text-xs">Masukkan password baru kamu (minimal 8 karakter).</p>
              <div>
                <label htmlFor="newPassword" className="block text-sm text-text-muted mb-2">Password Baru</label>
                <div className="relative">
                  <input id="newPassword" type={showPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 pr-12 text-text focus:border-accent focus:outline-none transition-colors"
                    placeholder="Minimal 8 karakter" required minLength={8} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={resetLoading}
                className="w-full gradient-primary py-3.5 rounded-xl text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
                {resetLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle className="w-5 h-5" /> Reset Password</>}
              </button>
              <button type="button" onClick={() => { setMode("login"); setError(""); setResetSuccess(""); router.push("/admin"); }}
                className="w-full text-text-muted text-sm hover:text-accent transition-colors py-1">
                Kembali ke Login
              </button>
            </form>
          )}
        </div>

        {/* Role info with dashboard links */}
        <div className="mt-6 bg-surface/50 rounded-xl p-4 border border-white/5">
          <p className="text-text-muted text-xs text-center mb-3">Akses berdasarkan role:</p>
          <div className="space-y-2">
            <a href="/admin/dashboard" className="flex items-center justify-between px-3 py-2 rounded-lg bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 transition-colors group">
              <span className="text-xs font-medium text-red-400">Admin</span>
              <span className="text-[10px] text-text-muted group-hover:text-red-400 transition-colors">/admin/dashboard →</span>
            </a>
            <a href="/admin/lead" className="flex items-center justify-between px-3 py-2 rounded-lg bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/10 transition-colors group">
              <span className="text-xs font-medium text-blue-400">Lead</span>
              <span className="text-[10px] text-text-muted group-hover:text-blue-400 transition-colors">/admin/lead →</span>
            </a>
            <a href="/admin/worker" className="flex items-center justify-between px-3 py-2 rounded-lg bg-green-500/5 hover:bg-green-500/10 border border-green-500/10 transition-colors group">
              <span className="text-xs font-medium text-green-400">Worker</span>
              <span className="text-[10px] text-text-muted group-hover:text-green-400 transition-colors">/admin/worker →</span>
            </a>
          </div>
          <p className="text-text-muted text-[10px] text-center mt-2">Login dulu, lalu redirect otomatis sesuai role</p>
        </div>

        {/* Back to home */}
        <div className="text-center mt-4">
          <a href="/" className="text-text-muted hover:text-accent text-sm transition-colors">
            ← Kembali ke Website
          </a>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    }>
      <AdminLoginContent />
    </Suspense>
  );
}
