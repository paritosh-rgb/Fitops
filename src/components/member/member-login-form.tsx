"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useToast } from "@/components/ui/toast-provider";
import LanguageToggle from "@/components/ui/language-toggle";
import { useUILanguage } from "@/lib/i18n/ui-language";

interface MemberLoginFormProps {
  gymIdParam?: string;
}

export default function MemberLoginForm({ gymIdParam = "" }: MemberLoginFormProps) {
  const { showToast } = useToast();
  const { lang, setLang } = useUILanguage();
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
  const t = lang === "hi"
    ? {
        title: "मेंबर लॉगिन",
        subtitle: "प्रोग्रेस देखने के लिए मेंबर आईडी और पासवर्ड से लॉगिन करें।",
        gymId: "जिम आईडी",
        memberId: "मेंबर आईडी",
        password: "पासवर्ड",
        login: "लॉगिन",
        signingIn: "लॉगिन हो रहा है...",
        newMember: "नए मेंबर?",
        create: "अकाउंट बनाएं",
      }
    : {
        title: "Member Login",
        subtitle: "Login with Member ID and password to view your progress dashboard.",
        gymId: "Gym ID",
        memberId: "Member ID",
        password: "Password",
        login: "Login",
        signingIn: "Signing in...",
        newMember: "New member?",
        create: "Create account",
      };

  return (
    <form className="login-card" onSubmit={onSubmit}>
      <p className="landing-tag">FitOps Member</p>
      <div className="section-head">
        <h1>{t.title}</h1>
        <LanguageToggle lang={lang} onChange={setLang} />
      </div>
      <p className="muted">{t.subtitle}</p>

      <label>
        {t.gymId}
        <input value={gymId} onChange={(e) => setGymId(e.target.value)} placeholder="bodyfit" />
      </label>

      <label>
        {t.memberId}
        <input value={memberId} onChange={(e) => setMemberId(e.target.value)} placeholder="FL-1001" />
      </label>

      <label>
        {t.password}
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
      </label>

      <button type="submit" disabled={loading}>
        {loading ? t.signingIn : t.login}
      </button>

      <p className="muted member-auth-link">
        {t.newMember} <Link href={signupHref}>{t.create}</Link>
      </p>
      {error ? <p className="error">{error}</p> : null}
    </form>
  );
}
