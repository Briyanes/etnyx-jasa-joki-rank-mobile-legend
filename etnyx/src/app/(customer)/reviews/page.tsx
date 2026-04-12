"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { ArrowLeft, Star, Shield, CheckCircle, Loader2 } from "lucide-react";
import Link from "next/link";

interface Testimonial {
  id: string;
  name: string;
  avatar_url: string | null;
  rank_from: string;
  rank_to: string;
  rating: number;
  comment: string;
  is_featured: boolean;
  created_at: string;
}

const rankLabels: Record<string, string> = {
  warrior: "Warrior",
  elite: "Elite",
  master: "Master",
  grandmaster: "Grandmaster",
  epic: "Epic",
  legend: "Legend",
  mythic: "Mythic",
  mythicglory: "Mythic Glory",
};

const t = {
  id: {
    title: "Review Customer",
    subtitle: "Review asli dari customer yang sudah menggunakan jasa ETNYX",
    back: "Kembali ke Beranda",
    verified: "Verified Customer",
    featured: "Featured",
    noReviews: "Belum ada review.",
    loading: "Memuat review...",
    stats: {
      totalOrders: "Order Selesai",
      avgRating: "Rating Rata-rata",
      safeRate: "Keamanan Akun",
    },
    writeReview: "Punya order yang sudah selesai? Review akan dikirim otomatis via WhatsApp.",
  },
  en: {
    title: "Customer Reviews",
    subtitle: "Real reviews from customers who have used ETNYX services",
    back: "Back to Home",
    verified: "Verified Customer",
    featured: "Featured",
    noReviews: "No reviews yet.",
    loading: "Loading reviews...",
    stats: {
      totalOrders: "Orders Done",
      avgRating: "Average Rating",
      safeRate: "Account Safety",
    },
    writeReview: "Have a completed order? Review link is sent automatically via WhatsApp.",
  },
};

export default function ReviewsPage() {
  const { locale } = useLanguage();
  const txt = t[locale as keyof typeof t] || t.id;
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderCount, setOrderCount] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/testimonials")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setTestimonials(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    fetch("/api/stats/orders")
      .then((r) => r.json())
      .then((data) => {
        if (data.count) setOrderCount(data.count);
      })
      .catch(() => {});
  }, []);

  const avgRating =
    testimonials.length > 0
      ? (testimonials.reduce((sum, t) => sum + t.rating, 0) / testimonials.length).toFixed(1)
      : "5.0";

  const renderStars = (rating: number) =>
    Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? "text-yellow-400 fill-yellow-400" : "text-white/10"}`}
      />
    ));

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-text-muted hover:text-accent text-sm mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {txt.back}
          </Link>

          <h1 className="text-2xl sm:text-3xl font-bold text-text mb-2">{txt.title}</h1>
          <p className="text-text-muted text-sm mb-8">{txt.subtitle}</p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            <div className="bg-surface rounded-xl border border-white/10 p-4 text-center">
              <p className="text-2xl font-bold text-accent">{orderCount ? `${orderCount.toLocaleString("id-ID")}+` : "..."}</p>
              <p className="text-text-muted text-xs mt-1">{txt.stats.totalOrders}</p>
            </div>
            <div className="bg-surface rounded-xl border border-white/10 p-4 text-center">
              <div className="flex items-center justify-center gap-1">
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                <span className="text-2xl font-bold text-text">{avgRating}</span>
              </div>
              <p className="text-text-muted text-xs mt-1">{txt.stats.avgRating}</p>
            </div>
            <div className="bg-surface rounded-xl border border-white/10 p-4 text-center">
              <div className="flex items-center justify-center gap-1">
                <Shield className="w-5 h-5 text-green-400" />
                <span className="text-2xl font-bold text-green-400">100%</span>
              </div>
              <p className="text-text-muted text-xs mt-1">{txt.stats.safeRate}</p>
            </div>
          </div>

          {/* Reviews grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20 text-text-muted gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">{txt.loading}</span>
            </div>
          ) : testimonials.length === 0 ? (
            <p className="text-center text-text-muted py-20">{txt.noReviews}</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {testimonials.map((review) => (
                <div
                  key={review.id}
                  className="bg-surface rounded-2xl p-6 border border-white/10 hover:border-accent/30 transition-all"
                >
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-3">
                    {review.avatar_url ? (
                      <img
                        src={review.avatar_url}
                        alt={review.name}
                        loading="lazy"
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-sm">
                        {getInitials(review.name)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-text text-sm truncate">{review.name}</h3>
                      <p className="text-xs text-text-muted">
                        {rankLabels[review.rank_from] || review.rank_from} →{" "}
                        {rankLabels[review.rank_to] || review.rank_to}
                      </p>
                    </div>
                    {review.is_featured && (
                      <span className="flex-shrink-0 px-2 py-0.5 rounded-full bg-accent/10 text-accent text-[10px] font-semibold">
                        {txt.featured}
                      </span>
                    )}
                  </div>

                  {/* Rating */}
                  <div className="flex gap-0.5 mb-3">{renderStars(review.rating)}</div>

                  {/* Comment */}
                  <p className="text-text-muted text-sm leading-relaxed">&ldquo;{review.comment}&rdquo;</p>

                  {/* Verified badge */}
                  <div className="mt-4 pt-3 border-t border-white/5">
                    <span className="text-xs text-green-400 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      {txt.verified}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Info */}
          <p className="text-center text-text-muted text-xs mt-8">{txt.writeReview}</p>
        </div>
      </main>
      <Footer />
    </>
  );
}
