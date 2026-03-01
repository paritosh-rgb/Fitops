"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast-provider";

interface LoginFormProps {
  nextPath: string;
}

export default function LoginForm({ nextPath }: LoginFormProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error ?? "Login failed");
      }

      showToast("Login successful", "success");
      router.push(nextPath);
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setLoading(false);
      setError(message);
      showToast(message, "error");
    }
  }

  return (
    <form className="login-card" onSubmit={onSubmit}>
      <p className="landing-tag">FitOps</p>
      <h1>Sign in</h1>
      <p className="muted">Use your admin credentials to access the dashboard modules.</p>

      <label>
        Username
        <input
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="admin@gym.local"
        />
      </label>

      <label>
        Password
        <input
          required
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
      </label>

      <button type="submit" disabled={loading}>
        {loading ? "Signing in..." : "Login"}
      </button>

      {error ? <p className="error">{error}</p> : null}
    </form>
  );
}
