import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fix turbopack workspace root warning
  turbopack: {
    root: "..",
  },
  // Security Headers
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), browsing-topics=()",
          },
          {
            key: "Content-Security-Policy",
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://googleads.g.doubleclick.net https://connect.facebook.net https://analytics.tiktok.com https://www.google.com;
              style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://www.googletagmanager.com;
              img-src 'self' data: https: blob:;
              font-src 'self' https://fonts.gstatic.com;
              connect-src 'self' https://*.supabase.co wss://*.supabase.co https://wa.me https://app.midtrans.com https://app.sandbox.midtrans.com https://www.google-analytics.com https://analytics.google.com https://region1.google-analytics.com https://www.googletagmanager.com https://www.facebook.com https://graph.facebook.com https://connect.facebook.net https://analytics.tiktok.com https://googleads.g.doubleclick.net;
              frame-src https://app.midtrans.com https://app.sandbox.midtrans.com https://www.googletagmanager.com https://td.doubleclick.net;
              frame-ancestors 'none';
              base-uri 'self';
              form-action 'self';
            `
              .replace(/\s{2,}/g, " ")
              .trim(),
          },
        ],
      },
    ];
  },
  // Image optimization
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
    ],
  },
  // Compression
  compress: true,
  // Power by header removal for security
  poweredByHeader: false,
  // React strict mode for better development
  reactStrictMode: true,
};

export default nextConfig;
