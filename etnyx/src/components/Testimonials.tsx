"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import CardCarousel from "@/components/CardCarousel";

interface Testimonial {
  id: string;
  name: string;
  avatar_url: string | null;
  rank_from: string;
  rank_to: string;
  rating: number;
  comment: string;
  is_featured: boolean;
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

// Static testimonials for initial load
const staticTestimonials: Testimonial[] = [
  {
    id: "1",
    name: "Aldi R.",
    avatar_url: null,
    rank_from: "epic",
    rank_to: "mythic",
    rating: 5,
    comment: "Cepat banget prosesnya! Dari Epic ke Mythic cuma 2 hari. Recommended!",
    is_featured: true,
  },
  {
    id: "2",
    name: "Sinta M.",
    avatar_url: null,
    rank_from: "legend",
    rank_to: "mythicglory",
    rating: 5,
    comment: "Boosternya pro, gak ada kendala sama sekali. Pasti order lagi!",
    is_featured: true,
  },
  {
    id: "3",
    name: "Budi S.",
    avatar_url: null,
    rank_from: "grandmaster",
    rank_to: "legend",
    rating: 5,
    comment: "Harga worth it, pelayanan ramah. Mantap!",
    is_featured: true,
  },
  {
    id: "4",
    name: "Dewi K.",
    avatar_url: null,
    rank_from: "epic",
    rank_to: "legend",
    rating: 5,
    comment: "Awalnya ragu, tapi ternyata beneran aman. Thanks ETNYX!",
    is_featured: false,
  },
  {
    id: "5",
    name: "Raka P.",
    avatar_url: null,
    rank_from: "master",
    rank_to: "mythic",
    rating: 4,
    comment: "Proses lancar, cuma agak lama dikit tapi hasilnya memuaskan.",
    is_featured: false,
  },
  {
    id: "6",
    name: "Nina W.",
    avatar_url: null,
    rank_from: "warrior",
    rank_to: "epic",
    rating: 5,
    comment: "Dari Warrior langsung Epic! Akun aman, winrate bagus.",
    is_featured: false,
  },
];

export default function Testimonials() {
  const { locale } = useLanguage();
  const [testimonials, setTestimonials] = useState<Testimonial[]>(staticTestimonials);
  const [showAll, setShowAll] = useState(false);

  const t = {
    id: {
      badge: "TESTIMONIALS",
      title: "Apa Kata",
      titleHighlight: "Mereka",
      subtitle: "Review asli dari customer yang sudah menggunakan jasa ETNYX",
      verified: "Verified Customer",
      showLess: "Tampilkan Lebih Sedikit",
      showMore: "Review Lainnya",
      ordersCompleted: "Order Selesai",
      rating: "Rating",
      safe: "Aman",
    },
    en: {
      badge: "TESTIMONIALS",
      title: "What They",
      titleHighlight: "Say",
      subtitle: "Real reviews from customers who have used ETNYX services",
      verified: "Verified Customer",
      showLess: "Show Less",
      showMore: "More Reviews",
      ordersCompleted: "Orders Done",
      rating: "Rating",
      safe: "Safe",
    },
  };

  const txt = t[locale];

  useEffect(() => {
    // Try to fetch from API, fallback to static
    const fetchTestimonials = async () => {
      try {
        const res = await fetch("/api/testimonials");
        if (res.ok) {
          const data = await res.json();
          if (data.length > 0) {
            setTestimonials(data);
          }
        }
      } catch {
        // Keep static testimonials
      }
    };
    fetchTestimonials();
  }, []);

  const displayedTestimonials = showAll ? testimonials : testimonials.slice(0, 3);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <svg
        key={i}
        className={`w-4 h-4 ${i < rating ? "text-yellow-400" : "text-muted/30"}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ));
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <section id="testimonials" className="py-10 lg:py-14 bg-surface/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-6">
          <span className="inline-block px-3 py-1 text-[10px] sm:text-xs font-medium text-accent bg-accent/10 rounded-full mb-3">
            {txt.badge}
          </span>
          <h2 className="text-2xl md:text-3xl font-bold text-text mb-2">
            {txt.title} <span className="text-primary">{txt.titleHighlight}</span>?
          </h2>
          <p className="text-muted max-w-lg mx-auto text-sm">
            {txt.subtitle}
          </p>
        </div>

        {/* Testimonials Carousel */}
        <CardCarousel desktopCols={3} tabletCols={2}>
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="bg-surface rounded-2xl p-6 border border-surface/50 hover:border-primary/30 transition-all h-full"
            >
              {/* Header */}
              <div className="flex items-center gap-4 mb-4">
                {testimonial.avatar_url ? (
                  <img
                    src={testimonial.avatar_url}
                    alt={testimonial.name}
                    loading="lazy"
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                    {getInitials(testimonial.name)}
                  </div>
                )}
                <div>
                  <h4 className="font-semibold text-text">{testimonial.name}</h4>
                  <p className="text-xs text-muted">
                    {rankLabels[testimonial.rank_from]} → {rankLabels[testimonial.rank_to]}
                  </p>
                </div>
              </div>

              {/* Rating */}
              <div className="flex gap-1 mb-3">{renderStars(testimonial.rating)}</div>

              {/* Comment */}
              <p className="text-muted text-sm leading-relaxed">"{testimonial.comment}"</p>

              {/* Featured Badge */}
              {testimonial.is_featured && (
                <div className="mt-4 pt-4 border-t border-surface/50">
                  <span className="text-xs text-accent flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {txt.verified}
                  </span>
                </div>
              )}
            </div>
          ))}
        </CardCarousel>
      </div>
    </section>
  );
}
