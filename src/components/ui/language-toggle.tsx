"use client";

import { UILanguage } from "@/lib/i18n/ui-language";

interface LanguageToggleProps {
  lang: UILanguage;
  onChange: (lang: UILanguage) => void;
}

export default function LanguageToggle({ lang, onChange }: LanguageToggleProps) {
  return (
    <button
      type="button"
      className="lang-toggle"
      onClick={() => onChange(lang === "en" ? "hi" : "en")}
      aria-label="Toggle language"
      title="Toggle language"
    >
      {lang === "en" ? "हिंदी" : "English"}
    </button>
  );
}
