"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useToast } from "@/components/ui/toast-provider";

interface MemberSignupFormProps {
  gymIdParam?: string;
}

export default function MemberSignupForm({ gymIdParam = "" }: MemberSignupFormProps) {
  const { showToast } = useToast();
  const [gymId, setGymId] = useState(gymIdParam);
  const [memberId, setMemberId] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      if (!gymId.trim() || !memberId.trim() || !password.trim() || !confirmPassword.trim()) {
        throw new Error("Please fill all required fields");
      }

      setLoading(true);
      setError(null);

      const response = await fetch("/api/public/member-auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gymId: gymId.trim(),
          memberId: memberId.trim(),
          name: name.trim(),
          phone: phone.trim(),
          password,
          confirmPassword,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Signup failed");
      }

      showToast("Member account created", "success");
      window.location.assign("/member/status");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Signup failed";
      setError(message);
      setLoading(false);
      showToast(message, "error");
    }
  }

  const loginHref = `/member/login${gymId.trim() ? `?gym=${encodeURIComponent(gymId.trim())}` : ""}`;

  return (
    <form className="signup-card" onSubmit={onSubmit}>
      <p className="landing-v2-tag">FitOps Member</p>
      <h1>Create Member Account</h1>
      <p>Use member ID + password to access your personal workout and renewal dashboard.</p>

      <label>
        Gym ID
        <input value={gymId} onChange={(e) => setGymId(e.target.value)} placeholder="bodyfit" />
      </label>

      <label>
        Member ID
        <input value={memberId} onChange={(e) => setMemberId(e.target.value)} placeholder="FL-1001" />
      </label>

      <div className="inline-fields">
        <label>
          Name (required for new member)
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Rohit Sharma" />
        </label>
        <label>
          Phone (required for new member)
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="9876543210" />
        </label>
      </div>

      <div className="inline-fields">
        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimum 6 characters" />
        </label>
        <label>
          Confirm Password
          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter password" />
        </label>
      </div>

      <button type="submit" disabled={loading}>
        {loading ? "Creating account..." : "Signup"}
      </button>

      <p className="muted member-auth-link">
        Already have account? <Link href={loginHref}>Login</Link>
      </p>
      {error ? <p className="error">{error}</p> : null}
    </form>
  );
}
