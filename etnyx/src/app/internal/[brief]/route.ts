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
  "ETNYX-Brand-Brief",
  "INSTAGRAM-CONTENT-PLAN",
  "VIDEO-SCRIPT-HOW-TO-ORDER",
]);

// .md-only files (no .html equivalent)
const MD_ONLY_FILES = new Set([
  "ETNYX-Brand-Brief",
  "INSTAGRAM-CONTENT-PLAN",
  "VIDEO-SCRIPT-HOW-TO-ORDER",
]);

function renderMarkdownAsHtml(filename: string, content: string): string {
  // Minimal markdown → HTML: headers, bold, italic, code, lists, hr
  const escaped = content
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const lines = escaped.split("\n");
  const html: string[] = [];
  let inList = false;

  for (const raw of lines) {
    const line = raw;
    if (/^### (.+)/.test(line)) {
      if (inList) { html.push("</ul>"); inList = false; }
      html.push(`<h3>${line.replace(/^### /, "")}</h3>`);
    } else if (/^## (.+)/.test(line)) {
      if (inList) { html.push("</ul>"); inList = false; }
      html.push(`<h2>${line.replace(/^## /, "")}</h2>`);
    } else if (/^# (.+)/.test(line)) {
      if (inList) { html.push("</ul>"); inList = false; }
      html.push(`<h1>${line.replace(/^# /, "")}</h1>`);
    } else if (/^---+$/.test(line.trim())) {
      if (inList) { html.push("</ul>"); inList = false; }
      html.push("<hr>");
    } else if (/^[\-\*] (.+)/.test(line)) {
      if (!inList) { html.push("<ul>"); inList = true; }
      const item = line.replace(/^[\-\*] /, "").replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\*(.+?)\*/g, "<em>$1</em>").replace(/`(.+?)`/g, "<code>$1</code>");
      html.push(`<li>${item}</li>`);
    } else if (line.trim() === "") {
      if (inList) { html.push("</ul>"); inList = false; }
      html.push("<br>");
    } else {
      if (inList) { html.push("</ul>"); inList = false; }
      const p = line.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\*(.+?)\*/g, "<em>$1</em>").replace(/`(.+?)`/g, "<code>$1</code>");
      html.push(`<p>${p}</p>`);
    }
  }
  if (inList) html.push("</ul>");

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${filename} — ETNYX Internal</title>
<style>
  body{background:#0F1419;color:#E6F1EF;font-family:Inter,-apple-system,sans-serif;max-width:860px;margin:0 auto;padding:40px 20px;line-height:1.7;}
  h1{color:#2DD4BF;font-size:28px;font-weight:900;border-bottom:1px solid #1E2A35;padding-bottom:12px;margin-bottom:24px;}
  h2{color:#7FA8A3;font-size:18px;font-weight:700;margin-top:32px;margin-bottom:8px;}
  h3{color:#A78BFA;font-size:15px;font-weight:700;margin-top:24px;margin-bottom:6px;}
  p{color:#C8D8D6;margin:6px 0;}
  ul{color:#C8D8D6;padding-left:22px;margin:8px 0;}
  li{margin:4px 0;}
  strong{color:#E6F1EF;}
  em{color:#7FA8A3;}
  code{background:#151B22;border:1px solid #1E2A35;border-radius:4px;padding:1px 6px;font-family:monospace;font-size:13px;color:#2DD4BF;}
  hr{border:none;border-top:1px solid #1E2A35;margin:24px 0;}
  .back{display:inline-block;margin-bottom:28px;color:#2DD4BF;text-decoration:none;font-size:13px;opacity:0.8;}
  .back:hover{opacity:1;}
</style>
</head>
<body>
<a href="/internal" class="back">← Kembali ke Brief Hub</a>
${html.join("\n")}
</body>
</html>`;
}

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

  // Serve file — .md files rendered as HTML, .html served directly
  const isMdOnly = MD_ONLY_FILES.has(nameWithoutExt);
  const filePath = path.join(
    process.cwd(),
    isMdOnly ? `${nameWithoutExt}.md` : `${nameWithoutExt}.html`
  );

  try {
    const content = await fs.readFile(filePath, "utf-8");
    const html = isMdOnly ? renderMarkdownAsHtml(nameWithoutExt, content) : content;
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
