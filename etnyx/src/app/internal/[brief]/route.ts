import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

export const runtime = "nodejs";

// Allowlist — only these files can be served
const ALLOWED_FILES = new Set([
  "ETNYX-90Day-Bulan-1",
  "ETNYX-90Day-Bulan-2",
  "ETNYX-90Day-Bulan-3",
  "ETNYX-90Day-Strategy-Reference",
  "ETNYX-GoogleAds-Master-Reference",
  "ETNYX-Instagram-9Post-Grid",
  "ETNYX-Meta-Ads-Strategy",
  "ETNYX-Reels-Post1-IntroBrand",
  "ETNYX-Reels-Post2-TutorialPaket",
  "ETNYX-Reels-Post4-PainPoint",
  "ETNYX-Reels-Post5-TutorialPerStar",
  "ETNYX-Reels-Post7-TutorialGendong",
  "ETNYX-Reels-Post8-PromoSlot",
  "ETNYX-System-Guide-v2",
  "ETNYX-System-Guide",
]);

function makeToken(): string {
  const secret = process.env.INTERNAL_BRIEF_SECRET ?? "";
  if (!secret) return "";
  return crypto
    .createHmac("sha256", secret)
    .update("etnyx-internal-v1")
    .digest("hex");
}

function isValidToken(token: string | undefined): boolean {
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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ brief: string }> }
) {
  const { brief } = await params;

  // Strict filename validation — prevent path traversal
  if (!brief || brief.includes("..") || brief.includes("/") || brief.includes("\\")) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const nameWithoutExt = brief.replace(/\.html$/i, "");
  if (!ALLOWED_FILES.has(nameWithoutExt)) {
    return new NextResponse("Not Found", { status: 404 });
  }

  // Auth check
  const cookieStore = await cookies();
  const token = cookieStore.get("etnyx_internal")?.value;
  if (!isValidToken(token)) {
    const loginUrl = new URL("/internal/login", request.url);
    loginUrl.searchParams.set("next", `/internal/${brief}`);
    return NextResponse.redirect(loginUrl);
  }

  // Serve file
  const filePath = path.join(process.cwd(), `${nameWithoutExt}.html`);
  try {
    const html = await fs.readFile(filePath, "utf-8");
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "X-Robots-Tag": "noindex, nofollow",
        "Cache-Control": "no-store, no-cache",
      },
    });
  } catch {
    return new NextResponse("Not Found", { status: 404 });
  }
}
