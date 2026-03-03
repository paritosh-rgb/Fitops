"use client";

import { FormEvent, useState } from "react";
import { useToast } from "@/components/ui/toast-provider";

interface CheckInClientProps {
  token: string;
  gymId: string;
  initialMemberId?: string;
}

type RewardTarget = 7 | 15 | 30;

interface MemberStatus {
  gymName: string;
  member: {
    id: string;
    memberCode: string;
    name: string;
    phone: string;
  };
  membership: {
    joinDate: string;
    expiryDate: string;
    planName: string;
    daysToExpiry: number | null;
  } | null;
  payment: {
    latestStatus: "paid" | "partial" | "pending";
    pendingDuesInr: number;
  };
  attendance: {
    lastVisitDate: string | null;
    visitsThisMonth: number;
    visitsLast30Days: number;
    streakDays: number;
  };
  trainerName: string | null;
  recommendation: string;
  workout: {
    weeklySplit: Array<{ day: string; focus: string }>;
    today: {
      day: string;
      focus: string;
      completionPct: number;
      trainerNote: string;
      exercises: Array<{ name: string; completed: boolean }>;
    };
  };
  diet: {
    calorieTarget: number;
    proteinTargetG: number;
    waterTargetGlasses: number;
    todayWaterGlasses: number;
    meals: Array<{ title: string; items: string[] }>;
    pdfUrl: string;
  };
  rewards: {
    currentStreak: number;
    milestones: Array<{
      target: RewardTarget;
      rewardLabel: string;
      unlocked: boolean;
      claimed: boolean;
    }>;
  };
}

export default function CheckInClient({ token, gymId, initialMemberId = "" }: CheckInClientProps) {
  const { showToast } = useToast();
  const [memberId, setMemberId] = useState(initialMemberId);
  const [busy, setBusy] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusData, setStatusData] = useState<MemberStatus | null>(null);

  async function loadStatus(showSuccessToast = true) {
    const normalizedMemberId = memberId.trim();
    if (!normalizedMemberId) return;

    try {
      setBusy(true);
      setError(null);
      setMessage(null);

      const params = new URLSearchParams({
        memberId: normalizedMemberId,
        token,
        gymId,
      });

      const response = await fetch(`/api/public/member-status?${params.toString()}`);
      const payload = (await response.json().catch(() => ({}))) as { error?: string } & MemberStatus;

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to load member status");
      }

      setStatusData(payload);
      if (showSuccessToast) {
        showToast("Member status loaded", "info");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unable to load member status";
      setError(msg);
      setStatusData(null);
      showToast(msg, "error");
    } finally {
      setBusy(false);
    }
  }

  async function runMemberAction(body: Record<string, unknown>, successMessage?: string) {
    const normalizedMemberId = memberId.trim();
    if (!normalizedMemberId) return;

    try {
      setActionBusy(true);
      setError(null);

      const response = await fetch("/api/public/member-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: normalizedMemberId,
          token,
          gymId,
          ...body,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
        status?: MemberStatus;
      };
      if (!response.ok) {
        throw new Error(payload.error ?? "Update failed");
      }

      if (payload.status) {
        setStatusData(payload.status);
      } else {
        await loadStatus(false);
      }

      showToast(successMessage ?? payload.message ?? "Updated", "success");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Update failed";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setActionBusy(false);
    }
  }

  async function shareRenewalRequest() {
    if (!statusData) return;
    const text = `Hi ${statusData.gymName}, this is ${statusData.member.name} (${statusData.member.memberCode}). I want to renew my membership. Please share payment details.`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    showToast("Opened WhatsApp with renewal request", "success");
  }

  async function toggleExercise(name: string) {
    await runMemberAction(
      {
        action: "toggle_exercise",
        exerciseName: name,
      },
      "Workout progress updated",
    );
  }

  async function setWater(glasses: number) {
    await runMemberAction(
      {
        action: "set_water",
        glasses,
      },
      "Water tracker updated",
    );
  }

  async function claimReward(target: RewardTarget) {
    await runMemberAction(
      {
        action: "claim_reward",
        target,
      },
      "Reward claimed successfully",
    );
  }

  function shareDietPlan() {
    if (!statusData) return;
    const meals = statusData.diet.meals
      .map((meal) => `${meal.title}: ${meal.items.join(", ")}`)
      .join("\n");
    const text = [
      `My diet plan from ${statusData.gymName}:`,
      `Calories: ${statusData.diet.calorieTarget} | Protein: ${statusData.diet.proteinTargetG}g`,
      meals,
    ].join("\n");
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  }

  async function checkIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setBusy(true);
      setError(null);
      setMessage(null);

      const response = await fetch("/api/public/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, token, gymId }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        alreadyMarked?: boolean;
        date?: string;
        member?: { name?: string; memberCode?: string };
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Check-in failed");
      }

      const memberName = payload.member?.name ?? "Member";
      const memberCode = payload.member?.memberCode ?? memberId.trim();
      const text = payload.alreadyMarked
        ? `${memberName} (${memberCode}) is already checked in for today.`
        : `${memberName} (${memberCode}) checked in successfully for ${payload.date}.`;

      setMessage(text);
      await loadStatus(false);
      showToast(text, "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to check in";
      setError(message);
      showToast(message, "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="checkin-card">
      <h1>Gym Check-In</h1>
      <p className="muted">Enter your Member ID to check in and view your progress dashboard.</p>

      <form onSubmit={checkIn} className="checkin-form">
        <label>
          Member ID
          <input
            required
            value={memberId}
            onChange={(e) => {
              setMemberId(e.target.value);
              setStatusData(null);
            }}
            placeholder="FL-1001"
          />
        </label>
        <div className="checkin-actions">
          <button type="submit" disabled={busy || !memberId.trim()}>
            {busy ? "Checking in..." : "Check In"}
          </button>
          <button
            type="button"
            className="secondary-btn"
            disabled={busy || actionBusy || !memberId.trim()}
            onClick={() => loadStatus(true)}
          >
            {busy ? "Loading..." : "View My Status"}
          </button>
        </div>
      </form>

      {statusData ? (
        <section className="member-status-panel">
          <div className="member-status-head">
            <h2>{statusData.member.name}</h2>
            <span className={`status-pill ${statusData.payment.latestStatus}`}>
              {statusData.payment.latestStatus}
            </span>
          </div>

          <div className="member-feature-grid member-two-modules">
            <article className="member-feature-card renewals-module">
              <h3>Renewals Module</h3>
              <div className="member-kpi-grid">
                <article>
                  <p>Plan</p>
                  <strong>{statusData.membership?.planName ?? "Not active"}</strong>
                </article>
                <article>
                  <p>Expiry</p>
                  <strong>{statusData.membership?.expiryDate ?? "-"}</strong>
                </article>
                <article>
                  <p>Days Left</p>
                  <strong>{statusData.membership?.daysToExpiry ?? "-"}</strong>
                </article>
                <article>
                  <p>Pending Dues</p>
                  <strong>Rs {statusData.payment.pendingDuesInr.toLocaleString("en-IN")}</strong>
                </article>
              </div>
              <p className="member-reco">{statusData.recommendation}</p>
              <p className="muted">
                Last visit: {statusData.attendance.lastVisitDate ?? "No check-in yet"} | Status:{" "}
                {statusData.payment.latestStatus}
              </p>
              <button type="button" className="renew-btn" onClick={shareRenewalRequest}>
                Renew / Ask for Help on WhatsApp
              </button>
            </article>

            <article className="member-feature-card workout-feature">
              <div className="section-head">
                <h3>Workout Plan Module</h3>
                <span className="status-pill low">{statusData.workout.today.completionPct}% done</span>
              </div>
              <p className="muted">
                {statusData.workout.today.day}: {statusData.workout.today.focus} | Trainer:{" "}
                {statusData.trainerName ?? "Unassigned"}
              </p>
              <div className="exercise-list">
                {statusData.workout.today.exercises.map((exercise) => (
                  <button
                    key={exercise.name}
                    type="button"
                    className={`exercise-btn ${exercise.completed ? "done" : ""}`}
                    disabled={busy || actionBusy}
                    onClick={() => toggleExercise(exercise.name)}
                  >
                    {exercise.completed ? "✓" : "○"} {exercise.name}
                  </button>
                ))}
              </div>
              <p className="member-reco">{statusData.workout.today.trainerNote}</p>
              <div className="split-chip-row">
                {statusData.workout.weeklySplit.map((split) => (
                  <span key={split.day} className="split-chip">
                    {split.day.slice(0, 3)}: {split.focus}
                  </span>
                ))}
              </div>

              <h4>Diet Plan</h4>
              <div className="diet-kpi-row">
                <span>Calories: {statusData.diet.calorieTarget}</span>
                <span>Protein: {statusData.diet.proteinTargetG}g</span>
                <span>Water: {statusData.diet.todayWaterGlasses}/{statusData.diet.waterTargetGlasses}</span>
              </div>
              <div className="water-actions">
                <button
                  type="button"
                  className="mini-btn"
                  disabled={busy || actionBusy}
                  onClick={() => setWater(Math.max(0, statusData.diet.todayWaterGlasses - 1))}
                >
                  -1 Glass
                </button>
                <button
                  type="button"
                  className="mini-btn"
                  disabled={busy || actionBusy}
                  onClick={() =>
                    setWater(
                      Math.min(statusData.diet.waterTargetGlasses, statusData.diet.todayWaterGlasses + 1),
                    )
                  }
                >
                  +1 Glass
                </button>
              </div>
              <div className="diet-actions">
                <a href={statusData.diet.pdfUrl} target="_blank" rel="noreferrer" className="mini-link-btn">
                  Download PDF
                </a>
                <button type="button" className="mini-btn secondary-btn" onClick={shareDietPlan}>
                  Share Plan
                </button>
              </div>

              <h4>Streak Rewards</h4>
              <p className="muted">Current streak: {statusData.rewards.currentStreak} days</p>
              <div className="streak-track">
                <div
                  className="streak-fill"
                  style={{ width: `${Math.min(100, Math.round((statusData.rewards.currentStreak / 30) * 100))}%` }}
                />
              </div>
              <div className="reward-list">
                {statusData.rewards.milestones.map((milestone) => (
                  <div key={milestone.target} className="reward-item">
                    <div>
                      <strong>{milestone.target}-day reward</strong>
                      <p>{milestone.rewardLabel}</p>
                    </div>
                    {milestone.claimed ? (
                      <span className="status-pill paid">Claimed</span>
                    ) : (
                      <button
                        type="button"
                        className="mini-btn"
                        disabled={busy || actionBusy || !milestone.unlocked}
                        onClick={() => claimReward(milestone.target)}
                      >
                        {milestone.unlocked ? "Claim" : "Locked"}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </article>
          </div>
        </section>
      ) : null}

      {message ? <p className="muted">{message}</p> : null}
      {error ? <p className="error">{error}</p> : null}
    </div>
  );
}
