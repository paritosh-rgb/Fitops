"use client";

import { FormEvent, useMemo, useState } from "react";
import { AttendanceLog, Member, Membership, Plan, Trainer } from "@/lib/types";
import { useToast } from "@/components/ui/toast-provider";

interface MembersModuleProps {
  members: Member[];
  memberships: Membership[];
  attendanceLogs: AttendanceLog[];
  plans: Plan[];
  trainers: Trainer[];
}

const FALLBACK_PLANS: Plan[] = [
  { id: "plan_m_1", name: "Monthly", type: "monthly", durationDays: 30, priceInr: 1499 },
  { id: "plan_q_1", name: "Quarterly", type: "quarterly", durationDays: 90, priceInr: 3999 },
  { id: "plan_y_1", name: "Yearly", type: "yearly", durationDays: 365, priceInr: 12999 },
];

async function sendJson(url: string, body: Record<string, unknown>, method = "POST") {
  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(payload.error ?? "Request failed");
  }
}

export default function MembersModule({
  members,
  memberships,
  attendanceLogs,
  plans,
  trainers,
}: MembersModuleProps) {
  const { showToast } = useToast();
  const effectivePlans = plans.length > 0 ? plans : FALLBACK_PLANS;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().slice(0, 10));

  const [newMember, setNewMember] = useState({
    memberCode: "",
    name: "",
    phone: "",
    preferredLanguage: "en",
    planId: effectivePlans[0]?.id ?? "",
    assignedTrainerId: trainers[0]?.id ?? "",
  });

  const [quickActions, setQuickActions] = useState({
    memberId: members[0]?.id ?? "",
    amountInr: effectivePlans[0]?.priceInr ?? 1000,
    paymentMethod: "upi",
    paymentStatus: "paid",
    renewPlanId: effectivePlans[0]?.id ?? "",
  });
  const [editMemberId, setEditMemberId] = useState(members[0]?.id ?? "");
  const [editMember, setEditMember] = useState(() => ({
    memberCode: members[0]?.memberCode ?? "",
    name: members[0]?.name ?? "",
    phone: members[0]?.phone ?? "",
    preferredLanguage: members[0]?.preferredLanguage ?? "en",
    assignedTrainerId: members[0]?.assignedTrainerId ?? "",
  }));

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
  const selectedEditMember = members.find((row) => row.id === editMemberId);
  const presentMemberIds = useMemo(() => {
    const set = new Set<string>();
    for (const row of attendanceLogs) {
      if (row.date === attendanceDate) {
        set.add(row.memberId);
      }
    }
    return set;
  }, [attendanceDate, attendanceLogs]);
  const presentMembers = useMemo(
    () => members.filter((member) => presentMemberIds.has(member.id)),
    [members, presentMemberIds],
  );

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
      await sendJson("/api/members", newMember);
    }, "Member created successfully");
  }

  function startEdit(memberId: string) {
    const member = members.find((row) => row.id === memberId);
    if (!member) return;

    setEditMemberId(memberId);
    setEditMember({
      memberCode: member.memberCode,
      name: member.name,
      phone: member.phone,
      preferredLanguage: member.preferredLanguage,
      assignedTrainerId: member.assignedTrainerId ?? "",
    });
  }

  async function updateMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editMemberId) return;

    await runAction(async () => {
      await sendJson(`/api/members/${editMemberId}`, editMember, "PATCH");
    }, "Member updated successfully");
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
            {effectivePlans.map((plan) => (
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
                      await sendJson(`/api/members/${quickActions.memberId}/attendance`, {});
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
                      await sendJson(`/api/members/${quickActions.memberId}/payments`, {
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
            {effectivePlans.map((plan) => (
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
              await sendJson(`/api/members/${quickActions.memberId}/renew`, {
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

      <form className="card" onSubmit={updateMember}>
        <h2>Edit Member</h2>
        {members.length === 0 ? (
          <p className="muted">No members available to edit.</p>
        ) : (
          <>
            <label>
              Select member
              <select
                value={editMemberId}
                onChange={(e) => startEdit(e.target.value)}
              >
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.memberCode} - {member.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Member ID
              <input
                required
                value={editMember.memberCode}
                onChange={(e) => setEditMember((x) => ({ ...x, memberCode: e.target.value }))}
              />
            </label>
            <label>
              Name
              <input
                required
                value={editMember.name}
                onChange={(e) => setEditMember((x) => ({ ...x, name: e.target.value }))}
              />
            </label>
            <label>
              Phone
              <input
                required
                value={editMember.phone}
                onChange={(e) => setEditMember((x) => ({ ...x, phone: e.target.value }))}
              />
            </label>
            <label>
              Preferred language
              <select
                value={editMember.preferredLanguage}
                onChange={(e) =>
                  setEditMember((x) => ({
                    ...x,
                    preferredLanguage: e.target.value as "en" | "hi",
                  }))
                }
              >
                <option value="en">English</option>
                <option value="hi">Hindi</option>
              </select>
            </label>
            <label>
              Trainer
              <select
                value={editMember.assignedTrainerId}
                onChange={(e) =>
                  setEditMember((x) => ({ ...x, assignedTrainerId: e.target.value }))
                }
              >
                <option value="">Unassigned</option>
                {trainers.map((trainer) => (
                  <option key={trainer.id} value={trainer.id}>
                    {trainer.name}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" disabled={busy || !selectedEditMember}>
              {busy ? "Saving..." : "Update Member"}
            </button>
          </>
        )}
      </form>

      <div className="card table-card span-2 tinted-card t2">
        <div className="section-head">
          <h2>Date-wise Attendance</h2>
          <span className="status-pill medium">
            Present: {presentMembers.length} / {members.length}
          </span>
        </div>

        <label>
          Select date
          <input
            type="date"
            value={attendanceDate}
            onChange={(e) => setAttendanceDate(e.target.value)}
          />
        </label>

        <table>
          <thead>
            <tr>
              <th>Member</th>
              <th>Member ID</th>
              <th>Phone</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => {
              const isPresent = presentMemberIds.has(member.id);
              return (
                <tr key={member.id}>
                  <td>{member.name}</td>
                  <td>{member.memberCode}</td>
                  <td>{member.phone}</td>
                  <td>
                    <span className={`status-pill ${isPresent ? "paid" : "pending"}`}>
                      {isPresent ? "Present" : "Absent"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
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
              <th>Action</th>
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
                  <td>
                    <button type="button" onClick={() => startEdit(member.id)}>
                      Edit
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
