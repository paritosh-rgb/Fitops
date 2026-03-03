"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useToast } from "@/components/ui/toast-provider";
import LanguageToggle from "@/components/ui/language-toggle";
import { useUILanguage } from "@/lib/i18n/ui-language";

interface MemberSignupFormProps {
  gymIdParam?: string;
}

export default function MemberSignupForm({ gymIdParam = "" }: MemberSignupFormProps) {
  const { showToast } = useToast();
  const { lang, setLang } = useUILanguage();
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
  const t = lang === "hi"
    ? {
        title: "मेंबर अकाउंट बनाएं",
        subtitle: "मेंबर आईडी + पासवर्ड से अपना पर्सनल डैशबोर्ड एक्सेस करें।",
        gymId: "जिम आईडी",
        memberId: "मेंबर आईडी",
        name: "नाम (नए मेंबर के लिए आवश्यक)",
        phone: "फोन (नए मेंबर के लिए आवश्यक)",
        password: "पासवर्ड",
        confirm: "कन्फर्म पासवर्ड",
        signup: "साइनअप",
        creating: "अकाउंट बन रहा है...",
        already: "पहले से अकाउंट है?",
        login: "लॉगिन",
      }
    : {
        title: "Create Member Account",
        subtitle: "Use member ID + password to access your personal workout and renewal dashboard.",
        gymId: "Gym ID",
        memberId: "Member ID",
        name: "Name (required for new member)",
        phone: "Phone (required for new member)",
        password: "Password",
        confirm: "Confirm Password",
        signup: "Signup",
        creating: "Creating account...",
        already: "Already have account?",
        login: "Login",
      };

  return (
    <form className="signup-card" onSubmit={onSubmit}>
      <p className="landing-v2-tag">FitOps Member</p>
      <div className="section-head">
        <h1>{t.title}</h1>
        <LanguageToggle lang={lang} onChange={setLang} />
      </div>
      <p>{t.subtitle}</p>

      <label>
        {t.gymId}
        <input value={gymId} onChange={(e) => setGymId(e.target.value)} placeholder="bodyfit" />
      </label>

      <label>
        {t.memberId}
        <input value={memberId} onChange={(e) => setMemberId(e.target.value)} placeholder="FL-1001" />
      </label>

      <div className="inline-fields">
        <label>
          {t.name}
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Rohit Sharma" />
        </label>
        <label>
          {t.phone}
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="9876543210" />
        </label>
      </div>

      <div className="inline-fields">
        <label>
          {t.password}
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimum 6 characters" />
        </label>
        <label>
          {t.confirm}
          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter password" />
        </label>
      </div>

      <button type="submit" disabled={loading}>
        {loading ? t.creating : t.signup}
      </button>

      <p className="muted member-auth-link">
        {t.already} <Link href={loginHref}>{t.login}</Link>
      </p>
      {error ? <p className="error">{error}</p> : null}
    </form>
  );
}
