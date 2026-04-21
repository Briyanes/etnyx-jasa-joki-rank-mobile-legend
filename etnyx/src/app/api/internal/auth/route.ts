import { NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";

function makeToken(): string {
  const secret = process.env.INTERNAL_BRIEF_SECRET ?? "";
  if (!secret) return "";
  return crypto
    .createHmac("sha256", secret)
    .update("etnyx-internal-v1")
    .digest("hex");
}

export async function POST(request: Request) {
  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const expected = process.env.INTERNAL_BRIEF_PASSWORD ?? "";
  const input = String(body.password ?? "");

  // Timing-safe comparison to prevent timing attacks
  const inputBuf = Buffer.from(input, "utf8");
  const expectedBuf = Buffer.from(expected, "utf8");

  let isValid = false;
  if (expected.length > 0 && inputBuf.length === expectedBuf.length) {
    isValid = crypto.timingSafeEqual(inputBuf, expectedBuf);
  }

  if (!isValid) {
    return NextResponse.json({ error: "Password salah" }, { status: 401 });
  }

  const token = makeToken();
  if (!token) {
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set("etnyx_internal", token, {
    httpOnly: true,
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 hours
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}
