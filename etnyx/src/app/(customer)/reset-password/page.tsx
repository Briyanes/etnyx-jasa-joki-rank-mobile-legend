"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";

const translations = {
  id: {
    titleReset: "Buat Password Baru",
    titleRequest: "Reset Password",
    successReset: "Password berhasil direset! Silakan login dengan password baru.",
    successRequest: "Link reset password sudah dikirim ke email kamu (jika terdaftar). Cek inbox dan folder spam.",
    newPassword: "Password Baru",
    confirmPassword: "Konfirmasi Password",
    minChars: "Minimal 6 karakter",
    repeatPassword: "Ulangi password",
    errorMismatch: "Password tidak sama",
    errorMinLength: "Password minimal 6 karakter",
    errorGeneric: "Terjadi kesalahan. Coba lagi.",
    login: "Login",
    resetBtn: "Reset Password",
    sending: "Mengirim...",
    loading: "Loading...",
    emailLabel: "Email",
    emailPlaceholder: "nama@email.com",
    emailDesc: "Masukkan email yang terdaftar untuk menerima link reset password.",
    sendLink: "Kirim Link Reset",
    backToLogin: "← Kembali ke Login",
  },
  en: {
    titleReset: "Create New Password",
    titleRequest: "Reset Password",
    successReset: "Password has been reset! Please login with your new password.",
    successRequest: "Reset link has been sent to your email (if registered). Check inbox and spam folder.",
    newPassword: "New Password",
    confirmPassword: "Confirm Password",
    minChars: "Minimum 6 characters",
    repeatPassword: "Repeat password",
    errorMismatch: "Passwords don't match",
    errorMinLength: "Password must be at least 6 characters",
    errorGeneric: "Something went wrong. Try again.",
    login: "Login",
    resetBtn: "Reset Password",
    sending: "Sending...",
    loading: "Loading...",
    emailLabel: "Email",
    emailPlaceholder: "name@email.com",
    emailDesc: "Enter your registered email to receive a password reset link.",
    sendLink: "Send Reset Link",
    backToLogin: "← Back to Login",
  },
};

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { locale } = useLanguage();
  const t = translations[locale as keyof typeof translations] || translations.id;

  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/customer/password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "request", email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setSuccess(t.successRequest);
    } catch {
      setError(t.errorGeneric);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError(t.errorMismatch);
      return;
    }
    if (newPassword.length < 6) {
      setError(t.errorMinLength);
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/customer/password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset", token, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setSuccess(t.successReset);
    } catch {
      setError(t.errorGeneric);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold text-primary">ETNYX</Link>
          <p className="text-muted mt-2">{token ? t.titleReset : t.titleRequest}</p>
        </div>

        <div className="bg-surface rounded-2xl p-6 md:p-8 border border-surface/50">
          {success ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm">
                {success}
              </div>
              <Link
                href="/login"
                className="block w-full py-3 bg-primary hover:bg-primary/90 text-background font-semibold rounded-xl transition-all text-center"
              >
                {t.login}
              </Link>
            </div>
          ) : token ? (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div>
                <label className="block text-sm text-muted mb-2">{t.newPassword}</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t.minChars}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 bg-background border border-surface/50 rounded-xl text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                />
              </div>
              <div>
                <label className="block text-sm text-muted mb-2">{t.confirmPassword}</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t.repeatPassword}
                  required
                  className="w-full px-4 py-3 bg-background border border-surface/50 rounded-xl text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                />
              </div>
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{error}</div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary hover:bg-primary/90 text-background font-semibold rounded-xl transition-all disabled:opacity-50"
              >
                {loading ? t.loading : t.resetBtn}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRequestReset} className="space-y-5">
              <p className="text-muted text-sm">{t.emailDesc}</p>
              <div>
                <label className="block text-sm text-muted mb-2">{t.emailLabel}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.emailPlaceholder}
                  required
                  className="w-full px-4 py-3 bg-background border border-surface/50 rounded-xl text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                />
              </div>
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{error}</div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary hover:bg-primary/90 text-background font-semibold rounded-xl transition-all disabled:opacity-50"
              >
                {loading ? t.sending : t.sendLink}
              </button>
            </form>
          )}

          <p className="text-center text-muted text-sm mt-6">
            <Link href="/login" className="text-primary hover:underline">{t.backToLogin}</Link>
          </p>
        </div>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted">Loading...</div>
      </main>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
