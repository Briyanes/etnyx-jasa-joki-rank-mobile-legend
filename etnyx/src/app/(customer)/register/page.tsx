"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { trackCompleteRegistration } from "@/lib/tracking";

const translations = {
  id: {
    subtitle: "Daftar akun baru",
    name: "Nama",
    namePlaceholder: "Nama kamu",
    email: "Email",
    whatsapp: "WhatsApp",
    whatsappOptional: "(opsional)",
    password: "Password",
    passwordPlaceholder: "Minimal 6 karakter",
    confirmPassword: "Konfirmasi Password",
    confirmPlaceholder: "Ulangi password",
    registerBtn: "Daftar",
    loading: "Loading...",
    hasAccount: "Sudah punya akun?",
    login: "Login",
    back: "← Kembali ke Home",
    errorMismatch: "Password tidak sama",
    errorMinLength: "Password minimal 6 karakter",
    errorDefault: "Registrasi gagal",
    errorGeneric: "Terjadi kesalahan. Coba lagi.",
  },
  en: {
    subtitle: "Create a new account",
    name: "Name",
    namePlaceholder: "Your name",
    email: "Email",
    whatsapp: "WhatsApp",
    whatsappOptional: "(optional)",
    password: "Password",
    passwordPlaceholder: "Minimum 6 characters",
    confirmPassword: "Confirm Password",
    confirmPlaceholder: "Repeat password",
    registerBtn: "Register",
    loading: "Loading...",
    hasAccount: "Already have an account?",
    login: "Login",
    back: "← Back to Home",
    errorMismatch: "Passwords don't match",
    errorMinLength: "Password must be at least 6 characters",
    errorDefault: "Registration failed",
    errorGeneric: "Something went wrong. Try again.",
  },
};

export default function RegisterPage() {
  const router = useRouter();
  const { locale } = useLanguage();
  const t = translations[locale as keyof typeof translations] || translations.id;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError(t.errorMismatch);
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError(t.errorMinLength);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/customer/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "register", 
          email, 
          password, 
          name,
          whatsapp: whatsapp || null 
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t.errorDefault);
        return;
      }

      trackCompleteRegistration();
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
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm text-muted mb-2">
                {t.name}
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t.namePlaceholder}
                required
                className="w-full px-4 py-3 bg-background border border-surface/50 rounded-xl text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm text-muted mb-2">
                {t.email}
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                required
                className="w-full px-4 py-3 bg-background border border-surface/50 rounded-xl text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
            </div>

            {/* WhatsApp */}
            <div>
              <label htmlFor="whatsapp" className="block text-sm text-muted mb-2">
                {t.whatsapp} <span className="text-muted/50">{t.whatsappOptional}</span>
              </label>
              <input
                id="whatsapp"
                type="tel"
                autoComplete="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="628xxxxxxxxxx"
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
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.passwordPlaceholder}
                required
                className="w-full px-4 py-3 bg-background border border-surface/50 rounded-xl text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm text-muted mb-2">
                {t.confirmPassword}
              </label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t.confirmPlaceholder}
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
              {loading ? t.loading : t.registerBtn}
            </button>
          </form>

          {/* Login Link */}
          <p className="text-center text-muted text-sm mt-6">
            {t.hasAccount}{" "}
            <Link href="/login" className="text-primary hover:underline">
              {t.login}
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
