"use client";

import { FormEvent, useMemo, useState } from "react";
import { Member, Membership, Plan, Trainer } from "@/lib/types";
import { useToast } from "@/components/ui/toast-provider";

interface MembersModuleProps {
  members: Member[];
  memberships: Membership[];
  plans: Plan[];
  trainers: Trainer[];
}

async function postJson(url: string, body: Record<string, unknown>) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(payload.error ?? "Request failed");
  }
}

export default function MembersModule({ members, memberships, plans, trainers }: MembersModuleProps) {
  const { showToast } = useToast();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newMember, setNewMember] = useState({
    memberCode: "",
    name: "",
    phone: "",
    preferredLanguage: "en",
    planId: plans[0]?.id ?? "",
    assignedTrainerId: trainers[0]?.id ?? "",
  });

  const [quickActions, setQuickActions] = useState({
    memberId: members[0]?.id ?? "",
    amountInr: plans[0]?.priceInr ?? 1000,
    paymentMethod: "upi",
    paymentStatus: "paid",
    renewPlanId: plans[0]?.id ?? "",
  });

  const currentMembershipByMemberId = useMemo(() => {
    const map = new Map<string, Membership>();
    for (const membership of memberships) {
      const current = map.get(membership.memberId);
      if (!current || membership.expiryDate > current.expiryDate) {
        map.set(membership.memberId, membership);
      }
    }
    return map;
  }, [memberships]);

  const selectedMembership = currentMembershipByMemberId.get(quickActions.memberId);

  async function runAction(action: () => Promise<void>, successMessage: string) {
    try {
      setBusy(true);
      setError(null);
      await action();
      showToast(successMessage, "success");
      window.location.reload();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setBusy(false);
      setError(message);
      showToast(message, "error");
    }
  }

  async function createMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runAction(async () => {
      await postJson("/api/members", newMember);
    }, "Member created successfully");
  }

  return (
    <section className="module-grid">
      <form className="card" onSubmit={createMember}>
        <h2>Add Member</h2>
        <label>
          Member ID
          <input
            required
            value={newMember.memberCode}
            onChange={(e) => setNewMember((x) => ({ ...x, memberCode: e.target.value }))}
            placeholder="FL-1001"
          />
        </label>
        <label>
          Name
          <input
            required
            value={newMember.name}
            onChange={(e) => setNewMember((x) => ({ ...x, name: e.target.value }))}
          />
        </label>
        <label>
          Phone
          <input
            required
            value={newMember.phone}
            onChange={(e) => setNewMember((x) => ({ ...x, phone: e.target.value }))}
          />
        </label>
        <label>
          Plan
          <select
            value={newMember.planId}
            onChange={(e) => setNewMember((x) => ({ ...x, planId: e.target.value }))}
          >
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name} - Rs {plan.priceInr}
              </option>
            ))}
          </select>
        </label>
        <label>
          Trainer
          <select
            value={newMember.assignedTrainerId}
            onChange={(e) => setNewMember((x) => ({ ...x, assignedTrainerId: e.target.value }))}
          >
            <option value="">Unassigned</option>
            {trainers.map((trainer) => (
              <option key={trainer.id} value={trainer.id}>
                {trainer.name}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" disabled={busy}>
          {busy ? "Saving..." : "Create Member"}
        </button>
      </form>

      <div className="card">
        <h2>Member Actions</h2>
        <label>
          Member
          <select
            value={quickActions.memberId}
            onChange={(e) => setQuickActions((x) => ({ ...x, memberId: e.target.value }))}
          >
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.memberCode} - {member.name}
              </option>
            ))}
          </select>
        </label>

        <div className="button-row">
          <button
            type="button"
            disabled={busy || !quickActions.memberId}
            onClick={() =>
              runAction(async () => {
                await postJson(`/api/members/${quickActions.memberId}/attendance`, {});
              }, "Attendance marked")
            }
          >
            Mark Attendance
          </button>

          <button
            type="button"
            disabled={busy || !quickActions.memberId}
            onClick={() =>
              runAction(async () => {
                await postJson(`/api/members/${quickActions.memberId}/payments`, {
                  amountInr: Number(quickActions.amountInr),
                  method: quickActions.paymentMethod,
                  status: quickActions.paymentStatus,
                });
              }, "Payment logged")
            }
          >
            Log Payment
          </button>
        </div>

        <label>
          Amount (Rs)
          <input
            type="number"
            value={quickActions.amountInr}
            onChange={(e) => setQuickActions((x) => ({ ...x, amountInr: Number(e.target.value) }))}
          />
        </label>

        <label>
          Payment method
          <select
            value={quickActions.paymentMethod}
            onChange={(e) => setQuickActions((x) => ({ ...x, paymentMethod: e.target.value }))}
          >
            <option value="cash">Cash</option>
            <option value="upi">UPI</option>
          </select>
        </label>

        <label>
          Payment status
          <select
            value={quickActions.paymentStatus}
            onChange={(e) => setQuickActions((x) => ({ ...x, paymentStatus: e.target.value }))}
          >
            <option value="paid">Paid</option>
            <option value="partial">Partial</option>
            <option value="pending">Pending</option>
          </select>
        </label>

        <label>
          Renew with plan
          <select
            value={quickActions.renewPlanId}
            onChange={(e) => setQuickActions((x) => ({ ...x, renewPlanId: e.target.value }))}
          >
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          disabled={busy || !quickActions.memberId}
          onClick={() =>
            runAction(async () => {
              await postJson(`/api/members/${quickActions.memberId}/renew`, {
                planId: quickActions.renewPlanId,
                paymentMethod: quickActions.paymentMethod,
                paymentStatus: quickActions.paymentStatus,
              });
            }, "Membership renewed")
          }
        >
          Renew Membership
        </button>

        {selectedMembership ? <p className="muted">Current expiry: {selectedMembership.expiryDate}</p> : null}
        {error ? <p className="error">{error}</p> : null}
      </div>

      <div className="card table-card span-2">
        <h2>Member Roster</h2>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Member ID</th>
              <th>Phone</th>
              <th>Expiry</th>
              <th>Trainer</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => {
              const membership = currentMembershipByMemberId.get(member.id);
              const trainer = trainers.find((row) => row.id === member.assignedTrainerId);

              return (
                <tr key={member.id}>
                  <td>{member.name}</td>
                  <td>{member.memberCode}</td>
                  <td>{member.phone}</td>
                  <td>{membership?.expiryDate ?? "-"}</td>
                  <td>{trainer?.name ?? "Unassigned"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
