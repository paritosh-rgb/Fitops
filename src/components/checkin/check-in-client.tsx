"use client";

import { FormEvent, useState } from "react";
import { useToast } from "@/components/ui/toast-provider";

interface CheckInClientProps {
  token: string;
  initialMemberId?: string;
}

export default function CheckInClient({ token, initialMemberId = "" }: CheckInClientProps) {
  const { showToast } = useToast();
  const [memberId, setMemberId] = useState(initialMemberId);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function checkIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setBusy(true);
      setError(null);
      setMessage(null);

      const response = await fetch("/api/public/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, token }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        alreadyMarked?: boolean;
        date?: string;
        member?: { name?: string; memberCode?: string };
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Check-in failed");
      }

      const memberName = payload.member?.name ?? "Member";
      const memberCode = payload.member?.memberCode ?? memberId;
      const text = payload.alreadyMarked
        ? `${memberName} (${memberCode}) is already checked in for today.`
        : `${memberName} (${memberCode}) checked in successfully for ${payload.date}.`;

      setMessage(text);
      showToast(text, "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to check in";
      setError(message);
      showToast(message, "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="checkin-card">
      <h1>Gym Check-In</h1>
      <p className="muted">Enter your Member ID and tap check in.</p>

      <form onSubmit={checkIn} className="checkin-form">
        <label>
          Member ID
          <input
            required
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
            placeholder="FL-1001"
          />
        </label>
        <button type="submit" disabled={busy || !memberId.trim()}>
          {busy ? "Checking in..." : "Check In"}
        </button>
      </form>

      {message ? <p className="muted">{message}</p> : null}
      {error ? <p className="error">{error}</p> : null}
    </div>
  );
}
