import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import crypto from "crypto";
import Link from "next/link";

function makeToken(): string {
  const secret = process.env.INTERNAL_BRIEF_SECRET ?? "";
  if (!secret) return "";
  return crypto
    .createHmac("sha256", secret)
    .update("etnyx-internal-v1")
    .digest("hex");
}

async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get("etnyx_internal")?.value;
  const expected = makeToken();
  if (!expected || !token) return false;
  try {
    const a = Buffer.from(expected, "hex");
    const b = Buffer.from(token, "hex");
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

const BRIEFS = [
  {
    category: "90-Day Content Plan",
    items: [
      { file: "ETNYX-90Day-Bulan-1.html", title: "Bulan 1 — W1-W6 (Post 1-21)", badge: "W1–W6", color: "#2DD4BF" },
      { file: "ETNYX-90Day-Bulan-2.html", title: "Bulan 2 — W7-W10 (Post 22-37)", badge: "W7–W10", color: "#2DD4BF" },
      { file: "ETNYX-90Day-Bulan-3.html", title: "Bulan 3 — W11-W13 (Post 38-45)", badge: "W11–W13", color: "#2DD4BF" },
      { file: "ETNYX-90Day-Strategy-Reference.html", title: "Strategy Reference Sheet", badge: "Referensi", color: "#7FA8A3" },
    ],
  },
  {
    category: "Instagram Launch (9-Post Grid)",
    items: [
      { file: "ETNYX-Instagram-9Post-Grid.html", title: "9-Post Grid Brief — W1 Launch", badge: "Brief Desain", color: "#A78BFA" },
    ],
  },
  {
    category: "Reels Animasi",
    items: [
      { file: "ETNYX-Reels-Post1-IntroBrand.html", title: "Post 1 — Intro Brand", badge: "Reels 30s", color: "#22C55E" },
      { file: "ETNYX-Reels-Post2-TutorialPaket.html", title: "Post 2 — Tutorial Paket", badge: "Reels 60s", color: "#22C55E" },
      { file: "ETNYX-Reels-Post4-PainPoint.html", title: "Post 4 — Pain Point", badge: "Reels 15s", color: "#22C55E" },
      { file: "ETNYX-Reels-Post5-TutorialPerStar.html", title: "Post 5 — Tutorial Per Star", badge: "Reels 60s", color: "#22C55E" },
      { file: "ETNYX-Reels-Post7-TutorialGendong.html", title: "Post 7 — Tutorial Gendong", badge: "Reels 60s", color: "#22C55E" },
      { file: "ETNYX-Reels-Post8-PromoSlot.html", title: "Post 8 — Promo Slot", badge: "Reels 30s", color: "#22C55E" },
    ],
  },
  {
    category: "Marketing Strategy",
    items: [
      { file: "ETNYX-Meta-Ads-Strategy.html", title: "Meta Ads Strategy", badge: "Ads", color: "#F59E0B" },
      { file: "ETNYX-GoogleAds-Master-Reference.html", title: "Google Ads Master Reference", badge: "Ads", color: "#F59E0B" },
    ],
  },
  {
    category: "System & Brand",
    items: [
      { file: "ETNYX-Brand-Brief.md", title: "Brand Brief", badge: "Brand", color: "#2DD4BF" },
      { file: "ETNYX-System-Guide-v2.html", title: "System Guide v2", badge: "Internal", color: "#7FA8A3" },
      { file: "ETNYX-System-Guide.html", title: "System Guide v1", badge: "Internal", color: "#7FA8A3" },
    ],
  },
  {
    category: "Content & Video",
    items: [
      { file: "INSTAGRAM-CONTENT-PLAN.md", title: "Instagram Content Plan", badge: "Konten", color: "#A78BFA" },
      { file: "VIDEO-SCRIPT-HOW-TO-ORDER.md", title: "Video Script — How to Order", badge: "Script", color: "#22C55E" },
    ],
  },
];

export default async function InternalIndexPage() {
  const auth = await isAuthenticated();
  if (!auth) redirect("/internal/login");

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0F1419",
        padding: "40px 20px",
        fontFamily: "Inter, -apple-system, sans-serif",
      }}
    >
      <div style={{ maxWidth: "760px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div
            style={{
              color: "#2DD4BF",
              fontSize: "28px",
              fontWeight: 900,
              letterSpacing: "3px",
            }}
          >
            ETNYX
          </div>
          <div style={{ color: "#7FA8A3", fontSize: "13px", marginTop: "6px" }}>
            Internal Brief Hub 🔒
          </div>
          <div
            style={{
              display: "inline-block",
              background: "rgba(45,212,191,0.08)",
              border: "1px solid rgba(45,212,191,0.2)",
              borderRadius: "8px",
              padding: "4px 14px",
              color: "#7FA8A3",
              fontSize: "11px",
              marginTop: "10px",
            }}
          >
            Sesi aktif 8 jam · Jangan bagikan link ini ke luar tim
          </div>
        </div>

        {/* Brief Categories */}
        {BRIEFS.map(({ category, items }) => (
          <div key={category} style={{ marginBottom: "32px" }}>
            <div
              style={{
                color: "#7FA8A3",
                fontSize: "10px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "1.5px",
                marginBottom: "10px",
                paddingLeft: "4px",
              }}
            >
              {category}
            </div>
            <div style={{ display: "grid", gap: "8px" }}>
              {items.map(({ file, title, badge, color }) => (
                <Link
                  key={file}
                  href={`/internal/${file}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    background: "#151B22",
                    border: "1px solid #1E2A35",
                    borderRadius: "10px",
                    padding: "14px 18px",
                    textDecoration: "none",
                    color: "inherit",
                    transition: "border-color 0.2s",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        color: "#E6F1EF",
                        fontWeight: 600,
                        fontSize: "13.5px",
                      }}
                    >
                      {title}
                    </div>
                  </div>
                  <div
                    style={{
                      background: `${color}18`,
                      color: color,
                      border: `1px solid ${color}35`,
                      borderRadius: "6px",
                      padding: "3px 9px",
                      fontSize: "10px",
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {badge}
                  </div>
                  <div style={{ color: "#2DD4BF", fontSize: "16px", opacity: 0.7 }}>
                    →
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}

        <div
          style={{
            textAlign: "center",
            marginTop: "20px",
            color: "#3D5268",
            fontSize: "11px",
          }}
        >
          ETNYX Internal · {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}
