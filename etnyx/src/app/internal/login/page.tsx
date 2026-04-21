"use client";

import { useState, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/internal/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        const next = searchParams.get("next") ?? "/internal";
        router.push(next);
      } else {
        const data = await res.json();
        setError(data.error ?? "Password salah");
        setPassword("");
      }
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0F1419",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Inter, -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          textAlign: "center",
          padding: "40px",
          background: "#151B22",
          border: "2px solid #2DD4BF",
          borderRadius: "16px",
          width: "360px",
          maxWidth: "90vw",
        }}
      >
        <div
          style={{
            color: "#2DD4BF",
            fontSize: "26px",
            fontWeight: 900,
            letterSpacing: "3px",
            marginBottom: "4px",
          }}
        >
          ETNYX
        </div>
        <div
          style={{ color: "#7FA8A3", fontSize: "12px", marginBottom: "28px" }}
        >
          Brief Internal — Team Only 🔒
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoFocus
            required
            style={{
              width: "100%",
              padding: "12px 16px",
              background: "#0D1117",
              border: `1px solid ${error ? "#EF4444" : "#1E2A35"}`,
              borderRadius: "8px",
              color: "#E6F1EF",
              fontSize: "14px",
              boxSizing: "border-box",
              outline: "none",
              marginBottom: "10px",
              fontFamily: "inherit",
            }}
          />
          {error && (
            <div
              style={{
                color: "#EF4444",
                fontSize: "11px",
                marginBottom: "10px",
                textAlign: "left",
              }}
            >
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading || !password}
            style={{
              width: "100%",
              padding: "12px",
              background:
                loading || !password
                  ? "#1E2A35"
                  : "linear-gradient(135deg, #2DD4BF, #14B8A6)",
              border: "none",
              borderRadius: "8px",
              color: loading || !password ? "#7FA8A3" : "#0F1419",
              fontWeight: 800,
              fontSize: "14px",
              cursor: loading || !password ? "not-allowed" : "pointer",
              letterSpacing: "0.5px",
              fontFamily: "inherit",
            }}
          >
            {loading ? "Memeriksa..." : "MASUK"}
          </button>
        </form>

        <div
          style={{ color: "#7FA8A3", fontSize: "10px", marginTop: "20px" }}
        >
          🔒 Terbatas untuk tim internal ETNYX
        </div>
      </div>
    </div>
  );
}

export default function InternalLoginPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: "100vh", background: "#0F1419" }} />
      }
    >
      <LoginForm />
    </Suspense>
  );
}
