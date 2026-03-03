"use client";

import { useMemo, useState } from "react";
import type { UILanguage } from "@/lib/i18n/ui-language";

interface LandingGrowthExtrasProps {
  lang: UILanguage;
}

export default function LandingGrowthExtras({ lang }: LandingGrowthExtrasProps) {
  const [dueMembers, setDueMembers] = useState(120);
  const [avgFee, setAvgFee] = useState(1500);
  const [improvement, setImprovement] = useState(22);

  const projection = useMemo(() => {
    const recoveredMembers = Math.round((dueMembers * improvement) / 100);
    const recoveredRevenue = recoveredMembers * avgFee;
    return { recoveredMembers, recoveredRevenue };
  }, [avgFee, dueMembers, improvement]);
  const t = lang === "hi"
    ? {
        roi: "आरओआई कैलकुलेटर",
        roiSub: "ऑटो रिन्यूअल और रिमाइंडर से मासिक रिकवरी रेवेन्यू का अनुमान लगाएं।",
        due: "इस महीने ड्यू मेंबर्स",
        avg: "औसत प्लान मूल्य (रु)",
        lift: "अपेक्षित रिकवरी वृद्धि (%)",
        recoveredMembers: "रिकवर हुए मेंबर्स",
        recoveredRevenue: "रिकवर हुई कमाई",
        demo: "लाइव डेमो स्ट्रिप",
        demoSub: "FitOps में जिम का दैनिक संचालन कैसे चलता है।",
        s1: "QR चेक-इन",
        s1c: "मेंबर एक QR स्कैन करके तुरंत अटेंडेंस मार्क करता है।",
        s2: "ड्यू और रिन्यूअल",
        s2c: "पेंडिंग ड्यू और एक्सपायरी रिमाइंडर WhatsApp पर जाते हैं।",
        s3: "मेंबर पोर्टल",
        s3c: "मेंबर लॉगिन करके वर्कआउट, डाइट, स्ट्रीक और रिवॉर्ड्स देखता है।",
        s4: "ओनर KPI व्यू",
        s4c: "कलेक्शन, ट्रेनर आउटपुट और रिस्क अलर्ट रोज अपडेट होते हैं।",
      }
    : {
        roi: "ROI Calculator",
        roiSub: "Estimate monthly revenue recovered from auto renewals and reminder flows.",
        due: "Members due this month",
        avg: "Average plan value (Rs)",
        lift: "Expected recovery lift (%)",
        recoveredMembers: "Recovered Members",
        recoveredRevenue: "Recovered Revenue",
        demo: "Live Demo Strip",
        demoSub: "How a day runs in FitOps for gym owners and members.",
        s1: "QR Check-In",
        s1c: "Member scans one QR and attendance is marked instantly.",
        s2: "Dues & Renewals",
        s2c: "Pending dues and expiry reminders are triggered on WhatsApp.",
        s3: "Member Portal",
        s3c: "Member logs in to view workout, diet, streak and rewards.",
        s4: "Owner KPI View",
        s4c: "Collections, trainer output and risk alerts update daily.",
      };

  return (
    <section className="landing-growth-extras" id="roi">
      <article className="landing-roi-card">
        <h2>{t.roi}</h2>
        <p>{t.roiSub}</p>
        <div className="roi-input-grid">
          <label>
            {t.due}
            <input
              type="number"
              min={0}
              value={dueMembers}
              onChange={(event) => setDueMembers(Number(event.target.value) || 0)}
            />
          </label>
          <label>
            {t.avg}
            <input
              type="number"
              min={0}
              value={avgFee}
              onChange={(event) => setAvgFee(Number(event.target.value) || 0)}
            />
          </label>
          <label>
            {t.lift}
            <input
              type="number"
              min={0}
              max={100}
              value={improvement}
              onChange={(event) => setImprovement(Number(event.target.value) || 0)}
            />
          </label>
        </div>
        <div className="roi-result-grid">
          <article>
            <p>{t.recoveredMembers}</p>
            <strong>{projection.recoveredMembers}</strong>
          </article>
          <article>
            <p>{t.recoveredRevenue}</p>
            <strong>Rs {projection.recoveredRevenue.toLocaleString("en-IN")}</strong>
          </article>
        </div>
      </article>

      <article className="landing-demo-card">
        <h2>{t.demo}</h2>
        <p>{t.demoSub}</p>
        <div className="demo-strip">
          <div className="demo-step d1">
            <span>1</span>
            <h3>{t.s1}</h3>
            <p>{t.s1c}</p>
          </div>
          <div className="demo-step d2">
            <span>2</span>
            <h3>{t.s2}</h3>
            <p>{t.s2c}</p>
          </div>
          <div className="demo-step d3">
            <span>3</span>
            <h3>{t.s3}</h3>
            <p>{t.s3c}</p>
          </div>
          <div className="demo-step d4">
            <span>4</span>
            <h3>{t.s4}</h3>
            <p>{t.s4c}</p>
          </div>
        </div>
      </article>
    </section>
  );
}
