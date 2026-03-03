"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import LandingGrowthExtras from "@/components/landing/landing-growth-extras";
import LanguageToggle from "@/components/ui/language-toggle";
import { useUILanguage } from "@/lib/i18n/ui-language";

const highlights = [
  { label: "Renewal Recovery", value: "+15% to +30%" },
  { label: "Dues Collection", value: "Automated" },
  { label: "Tier-2 Ready", value: "India-first UX" },
];

const featureCards = [
  {
    title: "Smart Renewals",
    copy: "Expiry nudges, churn risk scoring, and one-tap retention actions on WhatsApp.",
    tone: "f-a",
  },
  {
    title: "Revenue Stack",
    copy: "Track dues, supplements, referrals, and trainer performance in one workflow.",
    tone: "f-b",
  },
  {
    title: "Front Desk Speed",
    copy: "Single QR check-in, member self-service status, and instant KPI updates for owners.",
    tone: "f-c",
  },
];

const pricing = [
  { name: "Starter", price: "₹999/mo", points: "Up to 300 members" },
  { name: "Growth", price: "₹1,499/mo", points: "Up to 800 members + analytics" },
  { name: "Annual", price: "₹9,999/yr", points: "Best value with annual savings" },
];

const modules = [
  "Members & Attendance",
  "Renewals & Reminders",
  "Pending Dues Recovery",
  "Member Self Service",
  "QR Check-In",
  "Growth Campaigns",
  "Owner Expense Ledger",
];

const faqs = [
  {
    q: "Will this work for non-tech gym staff?",
    a: "Yes. The product is optimized for simple daily actions and WhatsApp-first communication.",
  },
  {
    q: "Can I use it in Tier-2 cities?",
    a: "Yes. Pricing, workflow, and reminders are designed for local Indian gyms.",
  },
  {
    q: "How quickly can I start?",
    a: "You can go live in a day with member import and basic front-desk onboarding.",
  },
];

const testimonials = [
  {
    name: "Arjun Singh",
    gym: "BodyFit, Lucknow",
    quote: "Renewals became predictable. We recovered members who had stopped visiting for weeks.",
    metric: "+27% renewal recovery",
  },
  {
    name: "Megha Verma",
    gym: "Iron Temple, Kanpur",
    quote: "Front desk follow-ups are finally structured. Dues collection improved every month.",
    metric: "Rs 48,000 dues recovered",
  },
  {
    name: "Nitin Yadav",
    gym: "Pulse Gym, Varanasi",
    quote: "Member portal reduced chaos. Trainers focus more on coaching and less on manual tracking.",
    metric: "2.3 hrs/day operational time saved",
  },
];

export default function LandingPage() {
  const { lang, setLang } = useUILanguage();
  const [pulseTick, setPulseTick] = useState(0);
  const [spotlightIndex, setSpotlightIndex] = useState(0);
  const whatsappText = encodeURIComponent(
    "Hi FitOps team, I want a 15-minute demo for my gym.",
  );
  const t = lang === "hi"
    ? {
        features: "फीचर्स",
        roi: "आरओआई",
        pricing: "प्राइसिंग",
        modules: "मॉड्यूल्स",
        faq: "प्रश्न",
        login: "लॉगिन",
        signup: "साइनअप",
        tag: "लोकल जिम के लिए राजस्व वृद्धि सिस्टम",
        hero: "अपने जिम को स्थिर रेवेन्यू इंजन बनाएं",
        heroSub:
          "भारतीय जिम के लिए बनाया गया, ताकि रिन्यूअल बढ़ें, ड्यूज रिकवर हों और मेंबर कंसिस्टेंसी बेहतर हो।",
        launch: "डैशबोर्ड खोलें",
        viewPricing: "प्राइसिंग देखें",
        testimonials: "जिम ओनर्स क्या कहते हैं",
        pricingTitle: "प्राइसिंग",
        modulesTitle: "मॉड्यूल्स",
        faqTitle: "FAQ",
        whatsappDemo: "WhatsApp डेमो",
      }
    : {
        features: "Features",
        roi: "ROI",
        pricing: "Pricing",
        modules: "Modules",
        faq: "FAQ",
        login: "Login",
        signup: "Signup",
        tag: "Revenue Growth System for Local Gyms",
        hero: "Turn Your Gym Into a Predictable Revenue Engine",
        heroSub:
          "Built for Indian gyms to increase renewals, recover dues, and improve member consistency without operational chaos.",
        launch: "Launch Dashboard",
        viewPricing: "View Pricing",
        testimonials: "What Gym Owners Say",
        pricingTitle: "Pricing",
        modulesTitle: "Modules",
        faqTitle: "FAQ",
        whatsappDemo: "WhatsApp Demo",
      };
  const pulseCards = useMemo(() => {
    const baseRenewals = 18 + (pulseTick % 9);
    const baseDues = 32000 + (pulseTick % 7) * 2200;
    const baseCheckins = 84 + (pulseTick % 13);
    const cards = lang === "hi"
      ? [
          { label: "आज रिकवर रिन्यूअल", value: `${baseRenewals}` },
          { label: "ड्यू कलेक्शन (रु)", value: baseDues.toLocaleString("en-IN") },
          { label: "लाइव चेक-इन", value: `${baseCheckins}` },
        ]
      : [
          { label: "Renewals Recovered Today", value: `${baseRenewals}` },
          { label: "Dues Collection (Rs)", value: baseDues.toLocaleString("en-IN") },
          { label: "Live Check-Ins", value: `${baseCheckins}` },
        ];
    return cards;
  }, [lang, pulseTick]);

  const spotlight = lang === "hi"
    ? [
        "स्मार्ट एक्सपायरी रिमाइंडर से सदस्यता रिकवरी",
        "ट्रेनर-वार रेवेन्यू और परफॉर्मेंस ट्रैकिंग",
        "मेंबर पोर्टल में डाइट + वर्कआउट + रिवॉर्ड्स",
      ]
    : [
        "Smart expiry reminders recovering lost renewals",
        "Trainer-wise revenue and performance tracking",
        "Member portal with workout, diet and rewards",
      ];

  useEffect(() => {
    const pulseTimer = window.setInterval(() => setPulseTick((x) => x + 1), 3500);
    const spotlightTimer = window.setInterval(
      () => setSpotlightIndex((x) => (x + 1) % spotlight.length),
      4200,
    );

    return () => {
      window.clearInterval(pulseTimer);
      window.clearInterval(spotlightTimer);
    };
  }, [spotlight.length]);

  return (
    <div className="landing-v2" id="home">
      <div className="landing-motion-orb orb-a" />
      <div className="landing-motion-orb orb-b" />
      <header className="landing-topbar">
        <Link href="/" className="landing-brand">FitOps</Link>
        <nav className="landing-nav">
          <a href="#features">{t.features}</a>
          <a href="#roi">{t.roi}</a>
          <a href="#pricing">{t.pricing}</a>
          <a href="#modules">{t.modules}</a>
          <a href="#faq">{t.faq}</a>
        </nav>
        <div className="landing-auth-actions">
          <LanguageToggle lang={lang} onChange={setLang} />
          <a href="/login?next=%2Fdashboard" className="landing-v2-btn mini ghost-dark">{t.login}</a>
          <a href="/signup" className="landing-v2-btn mini primary-dark">{t.signup}</a>
        </div>
      </header>

      <section className="landing-v2-hero">
        <p className="landing-v2-tag">{t.tag}</p>
        <h1>{t.hero}</h1>
        <p>{t.heroSub}</p>

        <div className="landing-v2-actions">
          <Link href="/login?next=%2Fdashboard" className="landing-v2-btn primary">
            {t.launch}
          </Link>
          <a href="#pricing" className="landing-v2-btn ghost">
            {t.viewPricing}
          </a>
        </div>

        <div className="landing-v2-highlights">
          {highlights.map((item) => (
            <article key={item.label}>
              <h3>{item.value}</h3>
              <p>{item.label}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-live-board">
        <article className="landing-spotlight">
          <p>{lang === "hi" ? "लाइव ग्रोथ स्पॉटलाइट" : "Live Growth Spotlight"}</p>
          <h2 key={spotlight[spotlightIndex]} className="spotlight-text">
            {spotlight[spotlightIndex]}
          </h2>
        </article>
        <div className="landing-pulse-grid">
          {pulseCards.map((card) => (
            <article key={card.label} className="pulse-card">
              <p>{card.label}</p>
              <strong>{card.value}</strong>
            </article>
          ))}
        </div>
      </section>

      <section id="features" className="landing-v2-features">
        {featureCards.map((card) => (
          <article key={card.title} className={card.tone}>
            <h2>{card.title}</h2>
            <p>{card.copy}</p>
          </article>
        ))}
      </section>

      <LandingGrowthExtras lang={lang} />

      <section className="landing-testimonials" id="proof">
        <h2>{t.testimonials}</h2>
        <div className="landing-testimonial-grid">
          {testimonials.map((item) => (
            <article key={item.name}>
              <p>&ldquo;{item.quote}&rdquo;</p>
              <h3>{item.name}</h3>
              <small>{item.gym}</small>
              <span>{item.metric}</span>
            </article>
          ))}
        </div>
      </section>

      <section id="pricing" className="landing-pricing">
        <h2>{t.pricingTitle}</h2>
        <div className="landing-pricing-grid">
          {pricing.map((plan) => (
            <article key={plan.name}>
              <h3>{plan.name}</h3>
              <p className="price">{plan.price}</p>
              <p>{plan.points}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="modules" className="landing-modules">
        <h2>{t.modulesTitle}</h2>
        <div className="landing-module-grid">
          {modules.map((item) => (
            <article key={item}>{item}</article>
          ))}
        </div>
      </section>

      <section id="faq" className="landing-faq">
        <h2>{t.faqTitle}</h2>
        <div className="landing-faq-grid">
          {faqs.map((item) => (
            <article key={item.q}>
              <h3>{item.q}</h3>
              <p>{item.a}</p>
            </article>
          ))}
        </div>
      </section>

      <a
        className="landing-sticky-whatsapp"
        href={`https://wa.me/?text=${whatsappText}`}
        target="_blank"
        rel="noreferrer"
      >
        {t.whatsappDemo}
      </a>
    </div>
  );
}
