import Link from "next/link";

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

export default function LandingPage() {
  return (
    <div className="landing-v2" id="home">
      <header className="landing-topbar">
        <Link href="/" className="landing-brand">FitOps</Link>
        <nav className="landing-nav">
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
          <a href="#modules">Modules</a>
          <a href="#faq">FAQ</a>
        </nav>
        <div className="landing-auth-actions">
          <a href="/login?next=%2Fdashboard" className="landing-v2-btn mini ghost-dark">Login</a>
          <a href="/signup" className="landing-v2-btn mini primary-dark">Signup</a>
        </div>
      </header>

      <section className="landing-v2-hero">
        <p className="landing-v2-tag">Revenue Growth System for Local Gyms</p>
        <h1>Turn Your Gym Into a Predictable Revenue Engine</h1>
        <p>
          Built for Indian gyms to increase renewals, recover dues, and improve member consistency
          without operational chaos.
        </p>

        <div className="landing-v2-actions">
          <Link href="/login?next=%2Fdashboard" className="landing-v2-btn primary">
            Launch Dashboard
          </Link>
          <a href="#pricing" className="landing-v2-btn ghost">
            View Pricing
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

      <section id="features" className="landing-v2-features">
        {featureCards.map((card) => (
          <article key={card.title} className={card.tone}>
            <h2>{card.title}</h2>
            <p>{card.copy}</p>
          </article>
        ))}
      </section>

      <section id="pricing" className="landing-pricing">
        <h2>Pricing</h2>
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
        <h2>Modules</h2>
        <div className="landing-module-grid">
          {modules.map((item) => (
            <article key={item}>{item}</article>
          ))}
        </div>
      </section>

      <section id="faq" className="landing-faq">
        <h2>FAQ</h2>
        <div className="landing-faq-grid">
          {faqs.map((item) => (
            <article key={item.q}>
              <h3>{item.q}</h3>
              <p>{item.a}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
