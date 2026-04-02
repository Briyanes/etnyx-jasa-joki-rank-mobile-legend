"use client";

import { createWhatsAppUrl } from "@/utils/helpers";

export default function FloatingCTA() {
  const handleClick = () => {
    window.open(createWhatsAppUrl("Floating Button"), "_blank", "noopener,noreferrer");
  };

  return (
    <>
      {/* Sticky Button - Mobile Only */}
      <div className="fixed bottom-0 left-0 right-0 p-4 glass border-t border-white/5 md:hidden z-50">
        <button
          onClick={handleClick}
          className="w-full gradient-primary py-4 rounded-2xl text-white font-bold text-lg flex items-center justify-center gap-2 animate-pulse-glow"
        >
          🚀 Order via WhatsApp
        </button>
      </div>

      {/* Spacer for mobile sticky button */}
      <div className="h-24 md:hidden" aria-hidden="true" />
    </>
  );
}
