"use client";

import { useMemo, useState } from "react";

export default function LandingGrowthExtras() {
  const [dueMembers, setDueMembers] = useState(120);
  const [avgFee, setAvgFee] = useState(1500);
  const [improvement, setImprovement] = useState(22);

  const projection = useMemo(() => {
    const recoveredMembers = Math.round((dueMembers * improvement) / 100);
    const recoveredRevenue = recoveredMembers * avgFee;
    return { recoveredMembers, recoveredRevenue };
  }, [avgFee, dueMembers, improvement]);

  return (
    <section className="landing-growth-extras" id="roi">
      <article className="landing-roi-card">
        <h2>ROI Calculator</h2>
        <p>Estimate monthly revenue recovered from auto renewals and reminder flows.</p>
        <div className="roi-input-grid">
          <label>
            Members due this month
            <input
              type="number"
              min={0}
              value={dueMembers}
              onChange={(event) => setDueMembers(Number(event.target.value) || 0)}
            />
          </label>
          <label>
            Average plan value (Rs)
            <input
              type="number"
              min={0}
              value={avgFee}
              onChange={(event) => setAvgFee(Number(event.target.value) || 0)}
            />
          </label>
          <label>
            Expected recovery lift (%)
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
            <p>Recovered Members</p>
            <strong>{projection.recoveredMembers}</strong>
          </article>
          <article>
            <p>Recovered Revenue</p>
            <strong>Rs {projection.recoveredRevenue.toLocaleString("en-IN")}</strong>
          </article>
        </div>
      </article>

      <article className="landing-demo-card">
        <h2>Live Demo Strip</h2>
        <p>How a day runs in FitOps for gym owners and members.</p>
        <div className="demo-strip">
          <div className="demo-step d1">
            <span>1</span>
            <h3>QR Check-In</h3>
            <p>Member scans one QR and attendance is marked instantly.</p>
          </div>
          <div className="demo-step d2">
            <span>2</span>
            <h3>Dues & Renewals</h3>
            <p>Pending dues and expiry reminders are triggered on WhatsApp.</p>
          </div>
          <div className="demo-step d3">
            <span>3</span>
            <h3>Member Portal</h3>
            <p>Member logs in to view workout, diet, streak and rewards.</p>
          </div>
          <div className="demo-step d4">
            <span>4</span>
            <h3>Owner KPI View</h3>
            <p>Collections, trainer output and risk alerts update daily.</p>
          </div>
        </div>
      </article>
    </section>
  );
}
