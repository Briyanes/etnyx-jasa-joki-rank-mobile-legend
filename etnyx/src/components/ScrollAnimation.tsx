"use client";

import { useEffect, useRef, useState, ReactNode } from "react";

interface ScrollAnimationProps {
  children: ReactNode;
  animation?: "fadeUp" | "fadeIn" | "slideLeft" | "slideRight" | "scale" | "blur";
  delay?: number;
  duration?: number;
  threshold?: number;
  className?: string;
}

export default function ScrollAnimation({
  children,
  animation = "fadeUp",
  delay = 0,
  duration = 600,
  threshold = 0.1,
  className = "",
}: ScrollAnimationProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  const animations = {
    fadeUp: {
      initial: "opacity-0 translate-y-8",
      visible: "opacity-100 translate-y-0",
    },
    fadeIn: {
      initial: "opacity-0",
      visible: "opacity-100",
    },
    slideLeft: {
      initial: "opacity-0 -translate-x-8",
      visible: "opacity-100 translate-x-0",
    },
    slideRight: {
      initial: "opacity-0 translate-x-8",
      visible: "opacity-100 translate-x-0",
    },
    scale: {
      initial: "opacity-0 scale-95",
      visible: "opacity-100 scale-100",
    },
    blur: {
      initial: "opacity-0 blur-sm",
      visible: "opacity-100 blur-0",
    },
  };

  const anim = animations[animation];

  return (
    <div
      ref={ref}
      className={`transition-all ${className} ${isVisible ? anim.visible : anim.initial}`}
      style={{
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
        transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      {children}
    </div>
  );
}
