"use client";

import { useEffect, useState } from "react";

export type UILanguage = "en" | "hi";

const LANG_KEY = "fitops_ui_language";

function detectLanguage(): UILanguage {
  if (typeof window === "undefined") return "en";
  const saved = window.localStorage.getItem(LANG_KEY);
  if (saved === "en" || saved === "hi") return saved;
  const browser = (window.navigator.language || "en").toLowerCase();
  return browser.startsWith("hi") ? "hi" : "en";
}

export function useUILanguage() {
  const [lang, setLang] = useState<UILanguage>(() => detectLanguage());

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(LANG_KEY, lang);
    document.documentElement.lang = lang;
  }, [lang]);

  return { lang, setLang };
}
