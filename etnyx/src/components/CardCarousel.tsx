"use client";

import { useRef, useState, useEffect, useCallback, ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CardCarouselProps {
  children: ReactNode[];
  /** Columns visible on desktop (lg+). Carousel activates when children > this. Default: 4 */
  desktopCols?: number;
  /** Columns visible on tablet (sm-lg). Default: 2 */
  tabletCols?: number;
  /** Gap between cards in px. Default: 16 */
  gap?: number;
}

function getVisibleCols(desktopCols: number, tabletCols: number): number {
  if (typeof window === "undefined") return desktopCols;
  if (window.innerWidth >= 1024) return desktopCols;
  if (window.innerWidth >= 640) return tabletCols;
  return 1;
}

export default function CardCarousel({
  children,
  desktopCols = 4,
  tabletCols = 2,
  gap = 16,
}: CardCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(desktopCols);
  const total = children.length;

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);

    // Calculate active index from scroll position
    if (total === 0) return;
    const cardWidth = el.scrollWidth / total;
    const idx = Math.round(el.scrollLeft / cardWidth);
    setActiveIndex(Math.min(idx, total - 1));
  }, [total]);

  useEffect(() => {
    const handleResize = () => {
      setVisibleCount(getVisibleCols(desktopCols, tabletCols));
      updateScrollState();
    };

    handleResize();
    const el = scrollRef.current;
    el?.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", handleResize);
    return () => {
      el?.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", handleResize);
    };
  }, [updateScrollState, desktopCols, tabletCols]);

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el || total === 0) return;
    const cardWidth = el.scrollWidth / total;
    el.scrollBy({ left: dir === "left" ? -cardWidth : cardWidth, behavior: "smooth" });
  };

  const scrollToIndex = (idx: number) => {
    const el = scrollRef.current;
    if (!el || total === 0) return;
    const cardWidth = el.scrollWidth / total;
    el.scrollTo({ left: cardWidth * idx, behavior: "smooth" });
  };

  const isDesktopCarousel = total > desktopCols;
  const showDots = total > 1;
  const dotCount = Math.max(total - visibleCount + 1, 1);

  return (
    <div className="relative group/carousel">
      {/* Scroll container */}
      <div
        ref={scrollRef}
        className="flex overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-hide"
        style={{ gap: `${gap}px` }}
      >
        {children.map((child, i) => (
          <div
            key={i}
            className="snap-start shrink-0"
            style={
              visibleCount === 1
                ? { width: "85%" }
                : { width: `calc((100% - ${gap * (visibleCount - 1)}px) / ${visibleCount})` }
            }
          >
            {child}
          </div>
        ))}
      </div>

      {/* Navigation arrows - desktop only, when carousel is active */}
      {isDesktopCarousel && (
        <>
          <button
            onClick={() => scroll("left")}
            className={`hidden lg:flex absolute -left-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 items-center justify-center rounded-full bg-surface/90 border border-white/10 text-text shadow-lg backdrop-blur-sm transition-all hover:bg-accent hover:text-background hover:border-accent ${
              canScrollLeft ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
            aria-label="Previous"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => scroll("right")}
            className={`hidden lg:flex absolute -right-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 items-center justify-center rounded-full bg-surface/90 border border-white/10 text-text shadow-lg backdrop-blur-sm transition-all hover:bg-accent hover:text-background hover:border-accent ${
              canScrollRight ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
            aria-label="Next"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {showDots && (
        <div className={`flex justify-center gap-1.5 mt-4 ${isDesktopCarousel ? "" : "lg:hidden"}`}>
          {Array.from({ length: dotCount }).map((_, i) => (
            <button
              key={i}
              onClick={() => scrollToIndex(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === activeIndex
                  ? "w-6 bg-accent"
                  : "w-2 bg-white/20 hover:bg-white/40"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
