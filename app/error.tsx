"use client";

import { useEffect } from "react";

export default function ErrorBoundary({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Verya route error", error);
  }, [error]);

  return (
    <main className="route-error-shell">
      <section className="route-error-card">
        <span className="eyebrow">VERYA RECOVERY</span>
        <h1>This workspace stopped unexpectedly.</h1>
        <p>Your project data is still stored locally. Retry this workspace without resetting the project.</p>
        <button className="primary" onClick={reset}>Retry workspace</button>
      </section>
    </main>
  );
}
