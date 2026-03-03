"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useToast } from "@/components/ui/toast-provider";

interface MemberLoginFormProps {
  gymIdParam?: string;
}

export default function MemberLoginForm({ gymIdParam = "" }: MemberLoginFormProps) {
  const { showToast } = useToast();
  const [gymId, setGymId] = useState(gymIdParam);
  const [memberId, setMemberId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      if (!gymId.trim() || !memberId.trim() || !password.trim()) {
        throw new Error("Please enter gym ID, member ID and password");
      }

      setLoading(true);
      setError(null);

      const response = await fetch("/api/public/member-auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gymId: gymId.trim(), memberId: memberId.trim(), password }),
      });

      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Login failed");
      }

      showToast("Member login successful", "success");
      window.location.assign("/member/status");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
      setLoading(false);
      showToast(message, "error");
    }
  }

  const signupHref = `/member/signup${gymId.trim() ? `?gym=${encodeURIComponent(gymId.trim())}` : ""}`;

  return (
    <form className="login-card" onSubmit={onSubmit}>
      <p className="landing-tag">FitOps Member</p>
      <h1>Member Login</h1>
      <p className="muted">Login with Member ID and password to view your progress dashboard.</p>

      <label>
        Gym ID
        <input value={gymId} onChange={(e) => setGymId(e.target.value)} placeholder="bodyfit" />
      </label>

      <label>
        Member ID
        <input value={memberId} onChange={(e) => setMemberId(e.target.value)} placeholder="FL-1001" />
      </label>

      <label>
        Password
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
      </label>

      <button type="submit" disabled={loading}>
        {loading ? "Signing in..." : "Login"}
      </button>

      <p className="muted member-auth-link">
        New member? <Link href={signupHref}>Create account</Link>
      </p>
      {error ? <p className="error">{error}</p> : null}
    </form>
  );
}
