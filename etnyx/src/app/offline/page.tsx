import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Kamu Sedang Offline — ETNYX",
  description: "Koneksi internet kamu terputus. Coba lagi setelah koneksi kembali.",
  robots: { index: false, follow: false },
};

/**
 * Offline fallback page (served by the service worker when a navigation
 * fails and no cache exists). Uses inline styles only — it must render
 * correctly even if the app's CSS chunk was never cached.
 */
export default function OfflinePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#0F1419",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div style={{ textAlign: "center", maxWidth: "420px" }}>
        <div style={{ fontSize: "56px", marginBottom: "20px" }}>📡</div>
        <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#FFFFFF", margin: "0 0 12px" }}>
          Kamu Sedang Offline
        </h1>
        <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.6)", lineHeight: 1.6, margin: "0 0 8px" }}>
          Koneksi internet kamu terputus. Halaman yang pernah kamu kunjungi tetap bisa dibuka dari cache.
        </p>
        <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", margin: "0 0 28px" }}>
          Tenang, data order kamu aman — tidak ada yang hilang.
        </p>
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            borderRadius: "12px",
            backgroundColor: "#FACC15",
            color: "#000000",
            padding: "12px 24px",
            fontSize: "14px",
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          🔄 Coba Lagi
        </Link>
      </div>
    </main>
  );
}
