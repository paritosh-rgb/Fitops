"use client";

import { FormEvent, useState } from "react";
import { Lead, Member, Referral } from "@/lib/types";
import { useToast } from "@/components/ui/toast-provider";

interface GrowthModuleProps {
  leads: Lead[];
  referrals: Referral[];
  members: Member[];
  expiredMembers: Array<{ memberId: string; memberName: string }>;
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

export default function GrowthModule({ leads, referrals, members, expiredMembers }: GrowthModuleProps) {
  const { showToast } = useToast();
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
      window.location.reload();
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
