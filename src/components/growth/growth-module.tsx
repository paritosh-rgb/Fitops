"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Lead, Member, Membership, Referral } from "@/lib/types";
import { useToast } from "@/components/ui/toast-provider";

interface GrowthModuleProps {
  leads: Lead[];
  referrals: Referral[];
  members: Member[];
  memberships: Membership[];
  expiredMembers: Array<{ memberId: string; memberName: string }>;
}

function pct(numerator: number, denominator: number): number {
  if (!denominator) return 0;
  return Math.round((numerator / denominator) * 100);
}

function sourceLabel(source: Lead["source"]): string {
  if (source === "walk_in") return "Walk-in";
  if (source === "instagram") return "Instagram";
  if (source === "referral") return "Referral";
  return "Other";
}

async function postJson(url: string, body: Record<string, unknown>) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const payload = (await response.json().catch(() => ({}))) as { error?: string };
  if (!response.ok) throw new Error(payload.error ?? "Request failed");
  return payload;
}

export default function GrowthModule({
  leads,
  referrals,
  members,
  memberships,
  expiredMembers,
}: GrowthModuleProps) {
  const { showToast } = useToast();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [leadForm, setLeadForm] = useState({ name: "", phone: "", source: "walk_in" });
  const [festivalForm, setFestivalForm] = useState({ festival: "Holi", discount: "15% comeback discount" });
  const [referralForm, setReferralForm] = useState({
    referrerMemberId: members[0]?.id ?? "",
    referredName: "",
    referredPhone: "",
    rewardType: "extension_15_days",
  });
  const currentMonth = new Date().toISOString().slice(0, 7);

  const kpi = useMemo(() => {
    const leadsThisMonth = leads.filter((lead) => lead.createdAt.startsWith(currentMonth));
    const followedLeads = leads.filter(
      (lead) => lead.status === "followed_up" || lead.status === "converted",
    ).length;
    const joinedReferrals = referrals.filter((row) => row.joined).length;
    const joinsThisMonth = memberships.filter((row) => row.joinDate.startsWith(currentMonth)).length;

    return {
      leadBank: leads.length,
      leadsThisMonth: leadsThisMonth.length,
      followUpCoveragePct: pct(followedLeads, leads.length),
      referralJoinRatePct: pct(joinedReferrals, referrals.length),
      leadToJoinPct: pct(joinsThisMonth, leadsThisMonth.length),
      winBackTargetPct: pct(expiredMembers.length, members.length),
    };
  }, [currentMonth, expiredMembers.length, leads, memberships, members.length, referrals]);

  const sourceBreakdown = useMemo(() => {
    const sourceTotals: Record<Lead["source"], number> = {
      walk_in: 0,
      instagram: 0,
      referral: 0,
      other: 0,
    };

    for (const lead of leads) {
      sourceTotals[lead.source] += 1;
    }

    const maxCount = Math.max(1, ...Object.values(sourceTotals));
    return (Object.keys(sourceTotals) as Array<Lead["source"]>).map((source) => ({
      source,
      label: sourceLabel(source),
      count: sourceTotals[source],
      widthPct: Math.round((sourceTotals[source] / maxCount) * 100),
      sharePct: pct(sourceTotals[source], leads.length),
    }));
  }, [leads]);

  async function run(action: () => Promise<void>, successMessage?: string) {
    try {
      setBusy(true);
      setStatus(null);
      setError(null);
      await action();
      if (successMessage) {
        setStatus(successMessage);
        showToast(successMessage, "success");
      }
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      showToast(message, "error");
      setBusy(false);
    }
  }

  async function createLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await run(async () => {
      await postJson("/api/leads", leadForm);
    }, "Lead added");
  }

  async function addReferral(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await run(async () => {
      await postJson("/api/referrals", referralForm);
    }, "Referral added");
  }

  return (
    <section className="module-grid">
      <div className="card span-2 kpi-panel growth-kpi-panel">
        <div className="section-head">
          <h2>Growth KPI Studio</h2>
          <span className="status-pill medium">Month: {currentMonth}</span>
        </div>
        <div className="kpi-chip-grid">
          <article className="kpi-chip c1">
            <p>Lead Bank</p>
            <strong>{kpi.leadBank}</strong>
            <small>{kpi.leadsThisMonth} this month</small>
          </article>
          <article className="kpi-chip c2">
            <p>Follow-up Coverage</p>
            <strong>{kpi.followUpCoveragePct}%</strong>
            <small>Leads contacted</small>
          </article>
          <article className="kpi-chip c3">
            <p>Referral Join Rate</p>
            <strong>{kpi.referralJoinRatePct}%</strong>
            <small>Friends converted</small>
          </article>
          <article className="kpi-chip c4">
            <p>Lead to Join</p>
            <strong>{kpi.leadToJoinPct}%</strong>
            <small>Monthly proxy funnel</small>
          </article>
          <article className="kpi-chip c5">
            <p>Win-back Target</p>
            <strong>{kpi.winBackTargetPct}%</strong>
            <small>Expired member pool</small>
          </article>
        </div>
      </div>

      <div className="card span-2 kpi-chart-card tinted-card t3">
        <h2>Lead Source Momentum</h2>
        <div className="source-bars">
          {sourceBreakdown.map((source) => (
            <div key={source.source} className="source-row">
              <p>{source.label}</p>
              <div className="bar-track">
                <div className={`bar-fill ${source.source}`} style={{ width: `${source.widthPct}%` }} />
              </div>
              <span>
                {source.count} ({source.sharePct}%)
              </span>
            </div>
          ))}
        </div>
      </div>

      <form className="card tinted-card t1" onSubmit={createLead}>
        <h2>Walk-in Lead Tracker</h2>
        <label>
          Name
          <input required value={leadForm.name} onChange={(e) => setLeadForm((x) => ({ ...x, name: e.target.value }))} />
        </label>
        <label>
          Phone
          <input required value={leadForm.phone} onChange={(e) => setLeadForm((x) => ({ ...x, phone: e.target.value }))} />
        </label>
        <label>
          Source
          <select value={leadForm.source} onChange={(e) => setLeadForm((x) => ({ ...x, source: e.target.value }))}>
            <option value="walk_in">Walk-in</option>
            <option value="instagram">Instagram</option>
            <option value="referral">Referral</option>
            <option value="other">Other</option>
          </select>
        </label>
        <button type="submit" disabled={busy}>{busy ? "Saving..." : "Add Lead"}</button>
      </form>

      <form className="card tinted-card t4" onSubmit={addReferral}>
        <h2>Bring a Friend Tracker</h2>
        <label>
          Referrer Member
          <select value={referralForm.referrerMemberId} onChange={(e) => setReferralForm((x) => ({ ...x, referrerMemberId: e.target.value }))}>
            {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </label>
        <label>
          Friend Name
          <input required value={referralForm.referredName} onChange={(e) => setReferralForm((x) => ({ ...x, referredName: e.target.value }))} />
        </label>
        <label>
          Friend Phone
          <input required value={referralForm.referredPhone} onChange={(e) => setReferralForm((x) => ({ ...x, referredPhone: e.target.value }))} />
        </label>
        <label>
          Reward
          <select value={referralForm.rewardType} onChange={(e) => setReferralForm((x) => ({ ...x, rewardType: e.target.value }))}>
            <option value="extension_15_days">15-day extension</option>
            <option value="free_shaker">Free shaker</option>
            <option value="free_tshirt">Free t-shirt</option>
          </select>
        </label>
        <button type="submit" disabled={busy}>{busy ? "Saving..." : "Add Referral"}</button>
      </form>

      <div className="card table-card span-2 tinted-card t2">
        <div className="section-head">
          <h2>Festival Broadcast (Expired Members)</h2>
          <button
            type="button"
            disabled={busy || !expiredMembers.length}
            onClick={() =>
              run(async () => {
                const result = (await postJson("/api/broadcasts/festival", festivalForm)) as {
                  sent?: number;
                  failed?: number;
                };
                const text = `Festival broadcast sent ${result.sent ?? 0}, failed ${result.failed ?? 0}`;
                setStatus(text);
                showToast(text, result.failed ? "info" : "success");
              })
            }
          >
            Send Broadcast
          </button>
        </div>

        <div className="inline-fields">
          <label>
            Festival
            <input value={festivalForm.festival} onChange={(e) => setFestivalForm((x) => ({ ...x, festival: e.target.value }))} />
          </label>
          <label>
            Offer
            <input value={festivalForm.discount} onChange={(e) => setFestivalForm((x) => ({ ...x, discount: e.target.value }))} />
          </label>
        </div>

        <h3>Leads</h3>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id}>
                <td>{lead.name}</td>
                <td>{lead.phone}</td>
                <td><span className={`status-pill ${lead.status === "new" ? "high" : "low"}`}>{lead.status}</span></td>
                <td>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      run(async () => {
                        await postJson(`/api/leads/${lead.id}/follow-up`, {});
                      }, `Follow-up sent to ${lead.name}`)
                    }
                  >
                    Send 24h Offer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <h3>Referrals</h3>
        <table>
          <thead>
            <tr>
              <th>Friend</th>
              <th>Phone</th>
              <th>Reward</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {referrals.map((ref) => (
              <tr key={ref.id}>
                <td>{ref.referredName}</td>
                <td>{ref.referredPhone}</td>
                <td>{ref.rewardType}</td>
                <td><span className={`status-pill ${ref.joined ? "paid" : "pending"}`}>{ref.joined ? "yes" : "no"}</span></td>
              </tr>
            ))}
          </tbody>
        </table>

        {status ? <p className="muted">{status}</p> : null}
        {error ? <p className="error">{error}</p> : null}
      </div>
    </section>
  );
}
