"use client";

import { RefreshCw, Home, AlertTriangle } from "lucide-react";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-error" />
        </div>
        <h1 className="text-xl font-semibold text-text mb-2">Halaman Gagal Dimuat</h1>
        <p className="text-text-muted text-sm mb-6">
          Coba refresh halaman atau kembali ke beranda.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={reset}
            className="flex items-center gap-2 px-5 py-2.5 gradient-primary rounded-lg text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <RefreshCw className="w-4 h-4" /> Coba Lagi
          </button>
          <a
            href="/"
            className="flex items-center gap-2 px-5 py-2.5 bg-surface border border-white/10 rounded-lg text-text text-sm hover:bg-white/5 transition-colors"
          >
            <Home className="w-4 h-4" /> Ke Beranda
          </a>
        </div>
      </div>
    </div>
  );
}
