"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

export default function LoadingScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Simulate loading progress
    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressTimer);
          return 100;
        }
        return prev + Math.random() * 30;
      });
    }, 150);

    // Hide loading screen after animation
    const hideTimer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => {
      clearInterval(progressTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!isLoading) return null;

  return (
    <div 
      className={`fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center transition-opacity duration-500 ${
        progress >= 100 ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Logo */}
      <div className="mb-8">
        <Image
          src="/logo/circle-landscape.webp"
          alt="ETNYX"
          width={200}
          height={50}
          className="h-12 w-auto animate-pulse"
          priority
        />
      </div>

      {/* Loading animation */}
      <div className="relative w-48 h-1 bg-surface rounded-full overflow-hidden mb-4">
        <div 
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-300"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>

      {/* Loading text */}
      <p className="text-muted text-sm animate-pulse">
        Loading...
      </p>

      {/* Decorative elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "0.5s" }} />
      </div>
    </div>
  );
}
