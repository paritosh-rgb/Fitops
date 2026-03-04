"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
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

const trustGyms = [
  "BodyFit Lucknow",
  "Iron Temple Kanpur",
  "Pulse Gym Varanasi",
  "Apex Fitness Indore",
  "Alpha Club Jaipur",
];

const solutionGroups = [
  {
    title: "Sales & Follow-ups",
    points: ["Walk-in lead pipeline", "Auto WhatsApp nudges", "Referral rewards tracker"],
  },
  {
    title: "Retention & Renewals",
    points: ["Expiry sequences", "Miss-you alerts", "Churn risk flags"],
  },
  {
    title: "Operations & Front Desk",
    points: ["Single QR check-in", "Pending dues board", "Trainer accountability"],
  },
  {
    title: "Member Experience",
    points: ["Workout + diet plans", "Streak rewards", "Member portal login"],
  },
];

const workflowSteps = [
  {
    step: "Step 1",
    title: "Onboard Your Gym",
    copy: "Import members, map plans, and assign trainers in one setup flow.",
  },
  {
    step: "Step 2",
    title: "Automate Follow-ups",
    copy: "Enable renewal, due, and inactive-member reminders on WhatsApp.",
  },
  {
    step: "Step 3",
    title: "Track Daily KPIs",
    copy: "View collections, check-ins, and trainer performance from one dashboard.",
  },
  {
    step: "Step 4",
    title: "Grow Predictably",
    copy: "Use referrals, campaigns, and data-backed actions to improve revenue month on month.",
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

type ComparisonStatus = "yes" | "partial" | "no";

interface ComparisonCell {
  label: string;
  status: ComparisonStatus;
}

interface ComparisonRow {
  feature: string;
  sheets: ComparisonCell;
  other: ComparisonCell;
  fitops: ComparisonCell;
}

const comparisonRows: ComparisonRow[] = [
  {
    feature: "Renewal reminders (WhatsApp)",
    sheets: { label: "Manual", status: "no" },
    other: { label: "Limited", status: "partial" },
    fitops: { label: "Automated + smart timing", status: "yes" },
  },
  {
    feature: "Pending dues recovery",
    sheets: { label: "No flow", status: "no" },
    other: { label: "Basic tracking", status: "partial" },
    fitops: { label: "One-click dynamic reminders", status: "yes" },
  },
  {
    feature: "Trainer KPI analytics",
    sheets: { label: "Not practical", status: "no" },
    other: { label: "Partial", status: "partial" },
    fitops: { label: "Revenue + retention view", status: "yes" },
  },
  {
    feature: "QR attendance check-in",
    sheets: { label: "Not supported", status: "no" },
    other: { label: "Sometimes add-on", status: "partial" },
    fitops: { label: "Single QR + member ID flow", status: "yes" },
  },
  {
    feature: "Member portal (workout + diet)",
    sheets: { label: "Not available", status: "no" },
    other: { label: "Varies by plan", status: "partial" },
    fitops: { label: "Built-in", status: "yes" },
  },
  {
    feature: "India-ready pricing",
    sheets: { label: "Cheap but limited", status: "partial" },
    other: { label: "Often expensive", status: "no" },
    fitops: { label: "Tier-2 friendly", status: "yes" },
  },
];

function statusIcon(status: ComparisonStatus): string {
  if (status === "yes") return "✓";
  if (status === "partial") return "~";
  return "✕";
}

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
  const [tourIndex, setTourIndex] = useState(0);
  const whatsappText = encodeURIComponent(
    "Hi FitOps team, I want a 15-minute demo for my gym.",
  );
  const t = lang === "hi"
    ? {
        features: "फीचर्स",
        roi: "आरओआई",
        compare: "तुलना",
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
        compareTitle: "Feature Comparison",
        modulesTitle: "मॉड्यूल्स",
        faqTitle: "FAQ",
        whatsappDemo: "WhatsApp डेमो",
      }
    : {
        features: "Features",
        roi: "ROI",
        compare: "Comparison",
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
        compareTitle: "Feature Comparison",
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
  const tourItems = lang === "hi"
    ? [
        {
          title: "स्मार्ट रिन्यूअल इंजन",
          screen: "Renewals",
          solve: "एक्सपायरी वाले मेंबर्स को समय पर रिमाइंडर, ताकि रिन्यूअल मिस न हो।",
        },
        {
          title: "ड्यू कलेक्शन बोर्ड",
          screen: "Pending Dues",
          solve: "पार्टियल पेमेंट और पेंडिंग बैलेंस एक जगह ट्रैक होकर तुरंत रिकवरी होती है।",
        },
        {
          title: "मेंबर पोर्टल मोमेंटम",
          screen: "Member Portal",
          solve: "वर्कआउट, डाइट और स्ट्रीक विजिबिलिटी से कंसिस्टेंसी और रिटेंशन बढ़ता है।",
        },
        {
          title: "ट्रेनर परफॉर्मेंस स्नैपशॉट",
          screen: "Trainers",
          solve: "हर ट्रेनर का आउटपुट और कन्वर्ज़न मापा जाता है, इंसेंटिव सही होते हैं।",
        },
      ]
    : [
        {
          title: "Smart Renewal Engine",
          screen: "Renewals",
          solve: "Expiry members get timely reminders so renewals are not missed.",
        },
        {
          title: "Dues Collection Board",
          screen: "Pending Dues",
          solve: "Partial payments and pending balances are tracked in one place for faster recovery.",
        },
        {
          title: "Member Portal Momentum",
          screen: "Member Portal",
          solve: "Workout, diet and streak visibility improves consistency and retention.",
        },
        {
          title: "Trainer Performance Snapshot",
          screen: "Trainers",
          solve: "Trainer-wise output and conversion are measured so incentives stay fair.",
        },
      ];

  const caseStudy = lang === "hi"
    ? {
        title: "केस स्टडी: BodyFit, Lucknow",
        before: "पहले",
        after: "बाद में (60 दिन)",
        b1: "मैन्युअल रजिस्टर + WhatsApp फॉलोअप",
        b2: "मासिक रिन्यूअल रिकवरी: 38%",
        b3: "पेंडिंग ड्यूज: रु 74,000",
        a1: "ऑटो रिमाइंडर + ड्यू ट्रैकिंग + मेंबर पोर्टल",
        a2: "मासिक रिन्यूअल रिकवरी: 64%",
        a3: "पेंडिंग ड्यूज: रु 29,000",
        timelineTitle: "इम्पैक्ट टाइमलाइन",
        t1: "Week 1: सदस्य डेटा और प्लान सेटअप",
        t2: "Week 2: एक्सपायरी और ड्यू WhatsApp फ्लो लाइव",
        t3: "Week 4: ट्रैनर KPI और मेंबर स्ट्रीक विजिबिलिटी",
        t4: "Week 8: रिन्यूअल और कलेक्शन दोनों में लगातार वृद्धि",
      }
    : {
        title: "Case Study: BodyFit, Lucknow",
        before: "Before",
        after: "After (60 days)",
        b1: "Manual register + ad-hoc WhatsApp follow-ups",
        b2: "Monthly renewal recovery: 38%",
        b3: "Pending dues: Rs 74,000",
        a1: "Auto reminders + dues tracking + member portal",
        a2: "Monthly renewal recovery: 64%",
        a3: "Pending dues: Rs 29,000",
        timelineTitle: "Impact Timeline",
        t1: "Week 1: member data and plan setup",
        t2: "Week 2: expiry + dues WhatsApp flows live",
        t3: "Week 4: trainer KPI and member streak visibility",
        t4: "Week 8: consistent uplift in renewals and collections",
      };

  const kpiRail = lang === "hi"
    ? [
        "आज रिन्यूअल रिकवरी: +22%",
        "ड्यू कलेक्शन: रु 18,400",
        "लाइव चेक-इन: 97",
        "मिस-यू मैसेज से री-एक्टिवेशन: 6",
        "औसत स्ट्रीक ग्रोथ: +3.1 दिन",
      ]
    : [
        "Renewal recovery today: +22%",
        "Dues collected: Rs 18,400",
        "Live check-ins: 97",
        "Reactivations from miss-you flows: 6",
        "Avg streak growth: +3.1 days",
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
          <a href="#comparison">{t.compare}</a>
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
        <div className="landing-v2-hero-main">
          <div className="landing-v2-hero-copy">
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
          </div>
          <div className="landing-hero-visual" aria-hidden="true">
            <Image src="/landing-gym-hero.svg" alt="" width={640} height={420} priority />
          </div>
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

      <section className="landing-trust-strip" aria-label="Trusted by gyms">
        <p>{lang === "hi" ? "इन जिम्स द्वारा भरोसा किया गया" : "Trusted by growing gyms across India"}</p>
        <div className="landing-trust-logos">
          {[...trustGyms, ...trustGyms].map((gym, idx) => (
            <span key={`${gym}-${idx}`}>{gym}</span>
          ))}
        </div>
      </section>

      <section id="features" className="landing-solution-architecture">
        <div className="section-headline">
          <p>{lang === "hi" ? "पूर्ण राजस्व स्टैक" : "Complete Revenue Stack"}</p>
          <h2>{lang === "hi" ? "आपके जिम के हर हिस्से के लिए मॉड्यूल" : "Modules for every gym growth lever"}</h2>
        </div>
        <div className="solution-grid">
          {solutionGroups.map((group) => (
            <article key={group.title}>
              <h3>{group.title}</h3>
              <ul>
                {group.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
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

      <section className="landing-v2-features">
        {featureCards.map((card) => (
          <article key={card.title} className={card.tone}>
            <h2>{card.title}</h2>
            <p>{card.copy}</p>
          </article>
        ))}
      </section>

      <section className="landing-kpi-rail" aria-label="Live KPI rail">
        <div className="kpi-rail-track">
          {[...kpiRail, ...kpiRail].map((item, index) => (
            <span key={`${item}-${index}`}>{item}</span>
          ))}
        </div>
      </section>

      <section className="landing-how-it-works">
        <div className="section-headline">
          <p>{lang === "hi" ? "कैसे काम करता है" : "How FitOps Works"}</p>
          <h2>{lang === "hi" ? "4 स्टेप में लाइव जिम ऑपरेशन" : "Go live in 4 practical steps"}</h2>
        </div>
        <div className="how-grid">
          {workflowSteps.map((item) => (
            <article key={item.step}>
              <span>{item.step}</span>
              <h3>{item.title}</h3>
              <p>{item.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-tour" id="tour">
        <article className="landing-tour-nav">
          <h2>{lang === "hi" ? "इंटरएक्टिव प्रोडक्ट टूर" : "Interactive Product Tour"}</h2>
          <p>
            {lang === "hi"
              ? "किसी भी मॉड्यूल पर क्लिक करें और देखें कि वह क्या समस्या हल करता है।"
              : "Click a module and instantly see what problem it solves."}
          </p>
          <div className="tour-btn-grid">
            {tourItems.map((item, index) => (
              <button
                key={item.screen}
                type="button"
                className={`tour-btn ${tourIndex === index ? "active" : ""}`}
                onClick={() => setTourIndex(index)}
              >
                {item.screen}
              </button>
            ))}
          </div>
        </article>
        <article className="landing-tour-preview">
          <p>{lang === "hi" ? "चयनित मॉड्यूल" : "Selected Module"}</p>
          <h3>{tourItems[tourIndex].title}</h3>
          <p>{tourItems[tourIndex].solve}</p>
        </article>
      </section>

      <section className="landing-case-study" id="case-study">
        <h2>{caseStudy.title}</h2>
        <div className="case-study-grid">
          <article>
            <p className="case-tag">{caseStudy.before}</p>
            <ul>
              <li>{caseStudy.b1}</li>
              <li>{caseStudy.b2}</li>
              <li>{caseStudy.b3}</li>
            </ul>
          </article>
          <article>
            <p className="case-tag">{caseStudy.after}</p>
            <ul>
              <li>{caseStudy.a1}</li>
              <li>{caseStudy.a2}</li>
              <li>{caseStudy.a3}</li>
            </ul>
          </article>
        </div>
        <div className="case-timeline">
          <h3>{caseStudy.timelineTitle}</h3>
          <div className="case-timeline-row">
            <span>{caseStudy.t1}</span>
            <span>{caseStudy.t2}</span>
            <span>{caseStudy.t3}</span>
            <span>{caseStudy.t4}</span>
          </div>
        </div>
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

      <section id="comparison" className="landing-comparison">
        <h2>{t.compareTitle}</h2>
        <div className="landing-comparison-wrap">
          <table className="landing-comparison-table">
            <thead>
              <tr>
                <th>Feature</th>
                <th>Google Sheets</th>
                <th>Other Gym Software</th>
                <th>FitOps</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row) => (
                <tr key={row.feature}>
                  <td>{row.feature}</td>
                  <td>
                    <span className={`cmp-cell-badge ${row.sheets.status}`}>
                      <span className="cmp-icon">{statusIcon(row.sheets.status)}</span>
                      {row.sheets.label}
                    </span>
                  </td>
                  <td>
                    <span className={`cmp-cell-badge ${row.other.status}`}>
                      <span className="cmp-icon">{statusIcon(row.other.status)}</span>
                      {row.other.label}
                    </span>
                  </td>
                  <td>
                    <span className={`cmp-cell-badge ${row.fitops.status}`}>
                      <span className="cmp-icon">{statusIcon(row.fitops.status)}</span>
                      {row.fitops.label}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
