"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast-provider";

export default function SignupForm() {
  const router = useRouter();
  const { showToast } = useToast();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("owner");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, confirmPassword, role }),
      });

      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Signup failed");
      }

      showToast("Signup successful. Please login.", "success");
      router.push("/login?next=%2Fdashboard");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Signup failed";
      setError(message);
      showToast(message, "error");
      setLoading(false);
    }
  }

  return (
    <form className="signup-card" onSubmit={onSubmit}>
      <p className="landing-v2-tag">Start Your Gym OS</p>
      <h1>Create Your Account</h1>
      <p>Set up your gym owner credentials to access the dashboard.</p>

      <label>
        Username
        <input
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="owner@fitlife.com"
        />
      </label>

      <label>
        Role
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="owner">Owner</option>
          <option value="front_desk">Front Desk</option>
          <option value="trainer">Trainer</option>
        </select>
      </label>

      <label>
        Password
        <input
          required
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Minimum 6 characters"
        />
      </label>

      <label>
        Confirm Password
        <input
          required
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Re-enter password"
        />
      </label>

      <button type="submit" disabled={loading}>
        {loading ? "Creating account..." : "Signup"}
      </button>

      {error ? <p className="error">{error}</p> : null}
    </form>
  );
}
