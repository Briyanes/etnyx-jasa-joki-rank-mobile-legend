"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";

const translations = {
  id: {
    subtitle: "Login ke akun kamu",
    email: "Email",
    password: "Password",
    loginBtn: "Login",
    loading: "Loading...",
    noAccount: "Belum punya akun?",
    register: "Daftar",
    back: "← Kembali ke Home",
    errorDefault: "Login gagal",
    errorGeneric: "Terjadi kesalahan. Coba lagi.",
  },
  en: {
    subtitle: "Login to your account",
    email: "Email",
    password: "Password",
    loginBtn: "Login",
    loading: "Loading...",
    noAccount: "Don't have an account?",
    register: "Register",
    back: "← Back to Home",
    errorDefault: "Login failed",
    errorGeneric: "Something went wrong. Try again.",
  },
};

export default function LoginPage() {
  const router = useRouter();
  const { locale } = useLanguage();
  const t = translations[locale as keyof typeof translations] || translations.id;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/customer/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t.errorDefault);
        return;
      }

      router.push("/dashboard");
    } catch {
      setError(t.errorGeneric);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold text-primary">
            ETNYX
          </Link>
          <p className="text-muted mt-2">{t.subtitle}</p>
        </div>

        {/* Form Card */}
        <div className="bg-surface rounded-2xl p-6 md:p-8 border border-surface/50">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm text-muted mb-2">
                {t.email}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                required
                className="w-full px-4 py-3 bg-background border border-surface/50 rounded-xl text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm text-muted mb-2">
                {t.password}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 bg-background border border-surface/50 rounded-xl text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary hover:bg-primary/90 text-background font-semibold rounded-xl transition-all disabled:opacity-50"
            >
              {loading ? t.loading : t.loginBtn}
            </button>
          </form>

          {/* Register Link */}
          <p className="text-center text-muted text-sm mt-6">
            {t.noAccount}{" "}
            <Link href="/register" className="text-primary hover:underline">
              {t.register}
            </Link>
          </p>
        </div>

        {/* Back to Home */}
        <p className="text-center mt-6">
          <Link href="/" className="text-muted hover:text-text text-sm">
            {t.back}
          </Link>
        </p>
      </div>
    </main>
  );
}
