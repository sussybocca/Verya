"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Verya startup error", error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#080c12", color: "#e8eef7", fontFamily: "system-ui, sans-serif" }}>
        <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
          <section style={{ width: "min(560px, 100%)", background: "#111823", border: "1px solid #26374b", borderRadius: 18, padding: 28 }}>
            <div style={{ color: "#7ee7ff", fontWeight: 800, letterSpacing: ".12em", fontSize: 12 }}>VERYA RECOVERY</div>
            <h1 style={{ margin: "12px 0 8px", fontSize: 28 }}>The editor hit a startup error.</h1>
            <p style={{ margin: "0 0 20px", color: "#aebdce", lineHeight: 1.6 }}>
              Your locally saved project has not been cleared. Retry the editor first; if the browser was holding an older deployment, use a clean reload.
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button onClick={reset} style={{ border: 0, borderRadius: 10, padding: "11px 16px", fontWeight: 700, background: "#7ee7ff", color: "#061018" }}>
                Retry editor
              </button>
              <button onClick={() => window.location.reload()} style={{ border: "1px solid #34475d", borderRadius: 10, padding: "11px 16px", fontWeight: 700, background: "#172130", color: "#e8eef7" }}>
                Reload page
              </button>
            </div>
            {error.digest && <small style={{ display: "block", marginTop: 18, color: "#6f8298" }}>Error reference: {error.digest}</small>}
          </section>
        </main>
      </body>
    </html>
  );
}
