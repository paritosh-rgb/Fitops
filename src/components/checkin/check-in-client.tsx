"use client";

import { FormEvent, useEffect, useState } from "react";
import { useToast } from "@/components/ui/toast-provider";
import LanguageToggle from "@/components/ui/language-toggle";
import { useUILanguage } from "@/lib/i18n/ui-language";

interface CheckInClientProps {
  token: string;
  gymId: string;
  initialMemberId?: string;
  mode?: "checkin" | "member";
}

type RewardTarget = 7 | 15 | 30;
type FitnessModule = "today" | "diet" | "twin" | "rewards" | "battles";

function todayWeekdayName(): string {
  const day = new Date().getDay();
  const index = day === 0 ? 6 : day - 1;
  return ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][index];
}

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
    day: string;
    calorieTarget: number;
    proteinTargetG: number;
    waterTargetGlasses: number;
    todayWaterGlasses: number;
    meals: Array<{ title: string; items: string[] }>;
    weeklyPlan: Array<{ day: string; mealCount: number; meals?: Array<{ title: string; items: string[] }> }>;
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
  twin: {
    weeklyScore: number;
    level: "Bronze" | "Silver" | "Gold" | "Titan";
    auraColor: string;
    avatarLabel: string;
  };
  sweatCredits: {
    balance: number;
    redemptions: Array<{ code: "pt_15" | "supp_100"; label: string; points: number }>;
  };
  streakBattles: {
    active: Array<{
      id: string;
      status: "active" | "completed";
      startDate: string;
      endDate: string;
      opponentName: string;
      myScore: number;
      opponentScore: number;
    }>;
    recent: Array<{
      id: string;
      status: "active" | "completed";
      startDate: string;
      endDate: string;
      opponentName: string;
      myScore: number;
      opponentScore: number;
    }>;
    leaderboard: Array<{
      memberId: string;
      name: string;
      memberCode: string;
      score: number;
    }>;
  };
}

export default function CheckInClient({
  token,
  gymId,
  initialMemberId = "",
  mode = "checkin",
}: CheckInClientProps) {
  const { showToast } = useToast();
  const { lang, setLang } = useUILanguage();
  const memberMode = mode === "member";
  const [memberId, setMemberId] = useState(initialMemberId);
  const [busy, setBusy] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusData, setStatusData] = useState<MemberStatus | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeModule, setActiveModule] = useState<"renewals" | "workout">("workout");
  const [activeFitnessModule, setActiveFitnessModule] = useState<FitnessModule>("today");
  const [selectedDietDay, setSelectedDietDay] = useState(todayWeekdayName());
  const [battleOpponentCode, setBattleOpponentCode] = useState("");
  const t = lang === "hi"
    ? {
        memberDashboard: "मेरा फिटनेस डैशबोर्ड",
        gymCheckin: "जिम चेक-इन",
        logout: "लॉगआउट",
        memberCopy: "आपकी व्यक्तिगत प्रगति, वर्कआउट, रिन्यूअल और रिवॉर्ड्स।",
        checkinCopy: "मेंबर आईडी दर्ज करें और चेक-इन करें।",
        memberId: "मेंबर आईडी",
        checkIn: "चेक-इन",
        checkingIn: "चेक-इन हो रहा है...",
      }
    : {
        memberDashboard: "My Fitness Dashboard",
        gymCheckin: "Gym Check-In",
        logout: "Logout",
        memberCopy: "Your personal progress, workout, renewals and rewards.",
        checkinCopy: "Enter your Member ID to check in and view your progress dashboard.",
        memberId: "Member ID",
        checkIn: "Check In",
        checkingIn: "Checking in...",
      };

  useEffect(() => {
    if (memberMode && initialMemberId.trim()) {
      void loadStatus(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberMode, initialMemberId, token, gymId]);

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
      setSelectedDietDay(payload.diet.day);
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
        setSelectedDietDay(payload.status.diet.day);
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

  async function createBattle() {
    if (!battleOpponentCode.trim()) return;
    await runMemberAction(
      {
        action: "create_battle",
        opponentMemberCode: battleOpponentCode.trim(),
      },
      "Battle created",
    );
    setBattleOpponentCode("");
  }

  async function redeemCredits(code: "pt_15" | "supp_100") {
    await runMemberAction(
      {
        action: "redeem_sweat",
        redemptionCode: code,
      },
      "Redemption request submitted",
    );
  }

  function shareDietPlan() {
    if (!statusData) return;
    const preview = selectedDietPlan(statusData);
    const meals = preview.meals
      .map((meal) => `${meal.title}: ${meal.items.join(", ")}`)
      .join("\n");
    const text = [
      `My diet plan from ${statusData.gymName}:`,
      `Day: ${preview.day}`,
      `Calories: ${statusData.diet.calorieTarget} | Protein: ${statusData.diet.proteinTargetG}g`,
      meals,
    ].join("\n");
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  }

  function selectedDietPlan(data: MemberStatus): {
    day: string;
    meals: Array<{ title: string; items: string[] }>;
  } {
    if (selectedDietDay === data.diet.day) {
      return { day: data.diet.day, meals: data.diet.meals };
    }

    const dayData = data.diet.weeklyPlan.find((row) => row.day === selectedDietDay);
    return { day: selectedDietDay, meals: dayData?.meals ?? [] };
  }

  function switchModule(moduleId: "renewals" | "workout") {
    setActiveModule(moduleId);
    setMenuOpen(false);
  }

  function switchFitnessModule(moduleId: FitnessModule) {
    setActiveFitnessModule(moduleId);
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
      if (!memberMode) {
        setStatusData(null);
      }
      showToast(text, "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to check in";
      setError(message);
      showToast(message, "error");
    } finally {
      setBusy(false);
    }
  }

  async function memberLogout() {
    try {
      await fetch("/api/public/member-auth/logout", { method: "POST" });
    } finally {
      window.location.assign(`/member/login?gym=${encodeURIComponent(gymId)}`);
    }
  }

  return (
    <div className="checkin-card">
      <div className="section-head">
        <h1>{memberMode ? t.memberDashboard : t.gymCheckin}</h1>
        <LanguageToggle lang={lang} onChange={setLang} />
        {memberMode ? (
          <button type="button" className="secondary-btn mini-btn" onClick={memberLogout}>
            {t.logout}
          </button>
        ) : null}
      </div>
      <p className="muted">
        {memberMode ? t.memberCopy : t.checkinCopy}
      </p>

      {!memberMode ? (
        <form onSubmit={checkIn} className="checkin-form">
          <label>
            {t.memberId}
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
          <div className="checkin-actions single">
            <button type="submit" disabled={busy || !memberId.trim()}>
              {busy ? t.checkingIn : t.checkIn}
            </button>
          </div>
        </form>
      ) : null}

      {memberMode && statusData ? (
        <section className="member-status-panel">
          <div className="member-status-head">
            <div>
              <h2>{statusData.member.name}</h2>
              <p className="member-subhead">
                {statusData.member.memberCode} | {statusData.membership?.planName ?? "No active plan"}
              </p>
            </div>
            <div className="status-head-actions">
              <span className={`status-pill ${statusData.payment.latestStatus}`}>
                {statusData.payment.latestStatus}
              </span>
              <button
                type="button"
                className="status-hamburger"
                aria-label="Open module menu"
                onClick={() => setMenuOpen((x) => !x)}
              >
                ☰
              </button>
            </div>
          </div>

          <div className="member-glance-row">
            <span className="member-glance-chip">
              Streak: {statusData.attendance.streakDays} days
            </span>
            <span className="member-glance-chip">
              Visits (30d): {statusData.attendance.visitsLast30Days}
            </span>
            <span className="member-glance-chip">
              Dues: Rs {statusData.payment.pendingDuesInr.toLocaleString("en-IN")}
            </span>
          </div>

          {menuOpen ? (
            <div className="status-hamburger-menu">
              <button type="button" onClick={() => switchModule("renewals")}>
                Renewals Module
              </button>
              <button type="button" onClick={() => switchModule("workout")}>
                Workout Plan Module
              </button>
            </div>
          ) : null}
          <div className="module-switch-pills">
            <button
              type="button"
              className={`module-pill ${activeModule === "workout" ? "active" : ""}`}
              onClick={() => switchModule("workout")}
            >
              Workout Plan
            </button>
            <button
              type="button"
              className={`module-pill ${activeModule === "renewals" ? "active" : ""}`}
              onClick={() => switchModule("renewals")}
            >
              Renewals
            </button>
          </div>

          <div className="member-feature-grid member-two-modules">
            {activeModule === "renewals" ? (
              <article id="renewals-module" className="member-feature-card renewals-module">
                <h3>Renewals Module</h3>
                <p className="module-caption">Track expiry, dues and renewal action in one place.</p>
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
            ) : null}

            {activeModule === "workout" ? (
              <article id="workout-module" className="member-feature-card workout-feature">
                <div className="section-head">
                  <h3>Workout Plan Module</h3>
                  <span className="status-pill low">{activeFitnessModule.toUpperCase()}</span>
                </div>
                <p className="module-caption">Clean sections for workout, diet, twin, rewards and battles.</p>
                <div className="fitness-switch-pills">
                  <button
                    type="button"
                    className={`module-pill ${activeFitnessModule === "today" ? "active" : ""}`}
                    onClick={() => switchFitnessModule("today")}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    className={`module-pill ${activeFitnessModule === "diet" ? "active" : ""}`}
                    onClick={() => switchFitnessModule("diet")}
                  >
                    Diet
                  </button>
                  <button
                    type="button"
                    className={`module-pill ${activeFitnessModule === "twin" ? "active" : ""}`}
                    onClick={() => switchFitnessModule("twin")}
                  >
                    Twin
                  </button>
                  <button
                    type="button"
                    className={`module-pill ${activeFitnessModule === "rewards" ? "active" : ""}`}
                    onClick={() => switchFitnessModule("rewards")}
                  >
                    Rewards
                  </button>
                  <button
                    type="button"
                    className={`module-pill ${activeFitnessModule === "battles" ? "active" : ""}`}
                    onClick={() => switchFitnessModule("battles")}
                  >
                    Battles
                  </button>
                </div>

                {activeFitnessModule === "today" ? (
                  <section className="fitness-module-panel">
                    <p className="muted">
                      {statusData.workout.today.day}: {statusData.workout.today.focus} | Trainer:{" "}
                      {statusData.trainerName ?? "Unassigned"}
                    </p>
                    <span className="status-pill low">{statusData.workout.today.completionPct}% completed</span>
                    {(() => {
                      const workoutPct = Math.max(0, Math.min(100, statusData.workout.today.completionPct));
                      const waterPct = Math.max(
                        0,
                        Math.min(
                          100,
                          Math.round(
                            (statusData.diet.todayWaterGlasses / Math.max(1, statusData.diet.waterTargetGlasses)) *
                              100,
                          ),
                        ),
                      );
                      const proteinPct = Math.max(
                        0,
                        Math.min(100, Math.round((statusData.diet.proteinTargetG / 140) * 100)),
                      );
                      const streakPct = Math.max(
                        0,
                        Math.min(100, Math.round((statusData.attendance.streakDays / 30) * 100)),
                      );
                      const rings = [
                        {
                          label: "Workout",
                          value: `${workoutPct}%`,
                          sub: `${statusData.workout.today.exercises.filter((row) => row.completed).length}/${statusData.workout.today.exercises.length} done`,
                          pct: workoutPct,
                          color: "#2f6cf2",
                        },
                        {
                          label: "Water",
                          value: `${statusData.diet.todayWaterGlasses}/${statusData.diet.waterTargetGlasses}`,
                          sub: "Hydration",
                          pct: waterPct,
                          color: "#10b981",
                        },
                        {
                          label: "Protein",
                          value: `${statusData.diet.proteinTargetG}g`,
                          sub: "Daily target",
                          pct: proteinPct,
                          color: "#f97316",
                        },
                        {
                          label: "Streak",
                          value: `${statusData.attendance.streakDays} days`,
                          sub: "Consistency",
                          pct: streakPct,
                          color: "#a855f7",
                        },
                      ] as const;

                      return (
                        <div className="goal-rings-grid">
                          {rings.map((ring) => (
                            <article key={ring.label} className="goal-ring-card">
                              <div
                                className="goal-ring"
                                style={{
                                  background: `conic-gradient(${ring.color} ${Math.round(ring.pct * 3.6)}deg, rgba(31, 61, 128, 0.14) 0deg)`,
                                }}
                                aria-label={`${ring.label} ${ring.pct}%`}
                              >
                                <span>{ring.pct}%</span>
                              </div>
                              <div>
                                <p>{ring.label}</p>
                                <strong>{ring.value}</strong>
                                <small>{ring.sub}</small>
                              </div>
                            </article>
                          ))}
                        </div>
                      );
                    })()}
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
                  </section>
                ) : null}

                {activeFitnessModule === "diet" ? (
                  <section className="fitness-module-panel">
                    <div className="diet-day-switch">
                      <p className="muted">Preview day</p>
                      <select value={selectedDietDay} onChange={(e) => setSelectedDietDay(e.target.value)}>
                        {statusData.diet.weeklyPlan.map((day) => (
                          <option key={day.day} value={day.day}>
                            {day.day}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="diet-kpi-row">
                      <span>Calories: {statusData.diet.calorieTarget}</span>
                      <span>Protein: {statusData.diet.proteinTargetG}g</span>
                      <span>
                        Water: {statusData.diet.todayWaterGlasses}/{statusData.diet.waterTargetGlasses}
                      </span>
                    </div>
                    <div className="split-chip-row">
                      {statusData.diet.weeklyPlan.map((day) => (
                        <span
                          key={day.day}
                          className={`split-chip ${day.day === selectedDietDay ? "active-day-chip" : ""}`}
                        >
                          {day.day.slice(0, 3)}: {day.mealCount} meals
                        </span>
                      ))}
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
                    <div className="meal-list">
                      {selectedDietPlan(statusData).meals.map((meal) => (
                        <div key={meal.title} className="meal-item">
                          <h4>{meal.title}</h4>
                          <p>{meal.items.join(" | ")}</p>
                        </div>
                      ))}
                    </div>
                    <div className="diet-actions">
                      <a href={statusData.diet.pdfUrl} target="_blank" rel="noreferrer" className="mini-link-btn">
                        Download PDF
                      </a>
                      <button type="button" className="mini-btn secondary-btn" onClick={shareDietPlan}>
                        Share Plan
                      </button>
                    </div>
                  </section>
                ) : null}

                {activeFitnessModule === "twin" ? (
                  <section className="fitness-module-panel">
                    <div className="twin-avatar-card">
                      <h4>Gym Twin Avatar</h4>
                      <div className="twin-avatar-meta">
                        <span className="twin-aura" style={{ background: statusData.twin.auraColor }} />
                        <div>
                          <strong>{statusData.twin.avatarLabel}</strong>
                          <p className="muted">
                            Level: {statusData.twin.level} | Weekly Score: {statusData.twin.weeklyScore}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="member-kpi-grid">
                      <article>
                        <p>Streak</p>
                        <strong>{statusData.attendance.streakDays} days</strong>
                      </article>
                      <article>
                        <p>Visits (30d)</p>
                        <strong>{statusData.attendance.visitsLast30Days}</strong>
                      </article>
                      <article>
                        <p>Workout</p>
                        <strong>{statusData.workout.today.completionPct}% done</strong>
                      </article>
                    </div>
                    <p className="member-reco">
                      Your Twin evolves with consistency. Mark workouts and follow the diet daily.
                    </p>
                  </section>
                ) : null}

                {activeFitnessModule === "rewards" ? (
                  <section className="fitness-module-panel">
                    <h4>Streak Rewards</h4>
                    <p className="muted">Current streak: {statusData.rewards.currentStreak} days</p>
                    <div className="streak-track">
                      <div
                        className="streak-fill"
                        style={{
                          width: `${Math.min(100, Math.round((statusData.rewards.currentStreak / 30) * 100))}%`,
                        }}
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
                    <h4>Sweat Credits Economy</h4>
                    <p className="muted">Balance: {statusData.sweatCredits.balance} credits</p>
                    <div className="reward-list">
                      {statusData.sweatCredits.redemptions.map((redemption) => (
                        <div key={redemption.code} className="reward-item">
                          <div>
                            <strong>{redemption.label}</strong>
                            <p>Cost: {redemption.points} credits</p>
                          </div>
                          <button
                            type="button"
                            className="mini-btn"
                            disabled={busy || actionBusy || statusData.sweatCredits.balance < redemption.points}
                            onClick={() => redeemCredits(redemption.code)}
                          >
                            Redeem
                          </button>
                        </div>
                      ))}
                    </div>
                  </section>
                ) : null}

                {activeFitnessModule === "battles" ? (
                  <section className="fitness-module-panel">
                    <h4>Streak Battles</h4>
                    <div className="battle-create-row">
                      <input
                        placeholder="Friend member ID (e.g. FL-1002)"
                        value={battleOpponentCode}
                        onChange={(e) => setBattleOpponentCode(e.target.value)}
                      />
                      <button
                        type="button"
                        className="mini-btn"
                        disabled={busy || actionBusy || !battleOpponentCode.trim()}
                        onClick={createBattle}
                      >
                        Challenge
                      </button>
                    </div>
                    <div className="reward-list">
                      {statusData.streakBattles.active.length === 0 ? (
                        <p className="muted">No active battle yet.</p>
                      ) : (
                        statusData.streakBattles.active.map((battle) => (
                          <div key={battle.id} className="reward-item">
                            <div>
                              <strong>vs {battle.opponentName}</strong>
                              <p>
                                {battle.startDate} to {battle.endDate}
                              </p>
                            </div>
                            <span className="status-pill medium">
                              {battle.myScore} : {battle.opponentScore}
                            </span>
                          </div>
                        ))
                      )}
                    </div>

                    <h4>Gym TV Leaderboard</h4>
                    <div className="reward-list">
                      {statusData.streakBattles.leaderboard.slice(0, 5).map((row, index) => (
                        <div key={row.memberId} className="reward-item">
                          <div>
                            <strong>
                              #{index + 1} {row.name}
                            </strong>
                            <p>{row.memberCode}</p>
                          </div>
                          <span className="status-pill paid">{row.score}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                ) : null}
              </article>
            ) : null}
          </div>
        </section>
      ) : null}

      {message ? <p className="muted">{message}</p> : null}
      {error ? <p className="error">{error}</p> : null}
    </div>
  );
}
