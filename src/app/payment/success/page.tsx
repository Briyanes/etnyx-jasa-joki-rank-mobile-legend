"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-surface rounded-2xl p-8 max-w-md w-full text-center border border-white/5">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
          <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-text mb-2">Pembayaran Berhasil! 🎉</h1>
        <p className="text-text-muted mb-6">
          Terima kasih! Pembayaran Anda telah diterima dan order sedang diproses.
        </p>

        {orderId && (
          <div className="bg-background rounded-xl p-4 mb-6">
            <p className="text-text-muted text-sm">Order ID</p>
            <p className="font-mono text-accent font-bold">{orderId}</p>
          </div>
        )}

        <div className="space-y-3">
          <Link 
            href={`/track?order_id=${orderId}`}
            className="block w-full gradient-primary px-6 py-3 rounded-xl text-white font-semibold hover:opacity-90 transition-opacity"
          >
            Track Order
          </Link>
          <Link 
            href="/"
            className="block w-full px-6 py-3 rounded-xl border border-white/10 text-text font-medium hover:bg-white/5 transition-colors"
          >
            Kembali ke Home
          </Link>
        </div>

        <p className="text-text-muted text-sm mt-6">
          Admin akan segera menghubungi Anda via WhatsApp untuk memulai proses joki.
        </p>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full"></div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
