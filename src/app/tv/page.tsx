"use client";

import { useEffect, useMemo, useState } from "react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

interface TvPayload {
  gymName: string;
  leaderboard: Array<{ memberId: string; name: string; memberCode: string; score: number }>;
  generatedAt: string;
}

function TvContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const gym = searchParams.get("gym") ?? "";
  const [payload, setPayload] = useState<TvPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  const query = useMemo(() => new URLSearchParams({ token, gym }).toString(), [gym, token]);

  useEffect(() => {
    if (!token || !gym) return;
    let active = true;

    async function refresh() {
      try {
        const response = await fetch(`/api/public/tv-leaderboard?${query}`, {
          cache: "no-store",
        });
        const data = (await response.json().catch(() => ({}))) as {
          error?: string;
        } & TvPayload;
        if (!response.ok) throw new Error(data.error ?? "Failed to load leaderboard");
        if (!active) return;
        setPayload(data);
        setError(null);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load leaderboard");
      }
    }

    refresh();
    const timer = setInterval(refresh, 25_000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [gym, query, token]);

  if (!token || !gym) {
    return (
      <main className="tv-root">
        <section className="tv-card">
          <h1>TV Leaderboard</h1>
          <p>Missing token or gym in URL.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="tv-root">
      <section className="tv-card">
        <header className="tv-head">
          <h1>{payload?.gymName ?? "FitOps"} Streak Battles</h1>
          <p>Live weekly consistency leaderboard</p>
        </header>
        {error ? <p className="error">{error}</p> : null}
        <div className="tv-list">
          {(payload?.leaderboard ?? []).slice(0, 10).map((row, index) => (
            <article key={row.memberId} className="tv-row">
              <div>
                <strong>
                  #{index + 1} {row.name}
                </strong>
                <p>{row.memberCode}</p>
              </div>
              <span>{row.score}</span>
            </article>
          ))}
        </div>
        <p className="muted">Auto-refresh every 25 seconds</p>
      </section>
    </main>
  );
}

export default function TvPage() {
  return (
    <Suspense
      fallback={
        <main className="tv-root">
          <section className="tv-card">
            <h1>TV Leaderboard</h1>
            <p>Loading leaderboard...</p>
          </section>
        </main>
      }
    >
      <TvContent />
    </Suspense>
  );
}
