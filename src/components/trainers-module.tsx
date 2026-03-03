"use client";

import { FormEvent, useMemo, useState } from "react";
import { useToast } from "@/components/ui/toast-provider";
import type { Member, MemberProgram, Trainer, TrainerSnapshot } from "@/lib/types";
import type { UserRole } from "@/lib/auth/rbac";

interface TrainersModuleProps {
  role: UserRole;
  trainers: Trainer[];
  trainerSnapshot: TrainerSnapshot[];
  totalMembers: number;
  members: Member[];
  programs: MemberProgram[];
}

const WEEK_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

function defaultProgramDraft() {
  return {
    workoutDays: WEEK_DAYS.map((day) => ({ day, focus: "", exercisesText: "" })),
    trainerNote: "",
    calorieTarget: 2200,
    proteinTargetG: 130,
    waterTargetGlasses: 12,
    breakfast: "",
    lunch: "",
    evening: "",
    dinner: "",
  };
}

function buildDraftFromProgram(program?: MemberProgram) {
  if (!program) return defaultProgramDraft();

  const dayMap = new Map(program.workoutDays.map((row) => [row.day.toLowerCase(), row]));
  const mealMap = new Map(program.dietMeals.map((row) => [row.title.toLowerCase(), row.items.join(", ")]));
  return {
    workoutDays: WEEK_DAYS.map((day) => {
      const current = dayMap.get(day.toLowerCase());
      return {
        day,
        focus: current?.focus ?? "",
        exercisesText: current?.exercises.join(", ") ?? "",
      };
    }),
    trainerNote: program.trainerNote ?? "",
    calorieTarget: program.calorieTarget,
    proteinTargetG: program.proteinTargetG,
    waterTargetGlasses: program.waterTargetGlasses,
    breakfast: mealMap.get("breakfast") ?? "",
    lunch: mealMap.get("lunch") ?? "",
    evening: mealMap.get("evening") ?? "",
    dinner: mealMap.get("dinner") ?? "",
  };
}

function pct(numerator: number, denominator: number): number {
  if (!denominator) return 0;
  return Math.round((numerator / denominator) * 100);
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

  return response.json().catch(() => ({}));
}

export default function TrainersModule({
  role,
  trainers,
  trainerSnapshot,
  totalMembers,
  members,
  programs,
}: TrainersModuleProps) {
  const { showToast } = useToast();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [programMemberId, setProgramMemberId] = useState(members[0]?.id ?? "");
  const [programDraft, setProgramDraft] = useState(() =>
    buildDraftFromProgram(programs.find((row) => row.memberId === members[0]?.id)),
  );
  const [copyTargets, setCopyTargets] = useState<string[]>([]);

  const snapshotByTrainerId = useMemo(() => {
    const map = new Map<string, TrainerSnapshot>();
    for (const row of trainerSnapshot) {
      map.set(row.trainerId, row);
    }
    return map;
  }, [trainerSnapshot]);

  const trainerKpi = useMemo(() => {
    const assigned = trainerSnapshot.reduce((sum, row) => sum + row.assignedMembers, 0);
    const activeAssigned = trainerSnapshot.reduce((sum, row) => sum + row.activeAssignedMembers, 0);
    const supplementInr = trainerSnapshot.reduce((sum, row) => sum + row.supplementRevenueInr, 0);

    const topRevenueTrainer = trainerSnapshot
      .slice()
      .sort((a, b) => b.supplementRevenueInr - a.supplementRevenueInr)[0];

    return {
      assigned,
      activeAssigned,
      avgActiveRatioPct: pct(activeAssigned, assigned),
      memberCoveragePct: pct(assigned, totalMembers),
      supplementInr,
      topRevenueTrainer,
    };
  }, [totalMembers, trainerSnapshot]);

  const programByMemberId = useMemo(() => {
    const map = new Map<string, MemberProgram>();
    for (const program of programs) {
      map.set(program.memberId, program);
    }
    return map;
  }, [programs]);

  async function addTrainer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setBusy(true);
      setError(null);
      await postJson("/api/trainers", { name });
      showToast("Trainer added successfully", "success");
      window.location.reload();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to add trainer";
      setBusy(false);
      setError(message);
      showToast(message, "error");
    }
  }

  function loadProgram(memberId: string) {
    setProgramMemberId(memberId);
    setCopyTargets([]);
    const program = programByMemberId.get(memberId);
    setProgramDraft(buildDraftFromProgram(program));
  }

  function toggleCopyTarget(memberId: string) {
    setCopyTargets((current) =>
      current.includes(memberId) ? current.filter((id) => id !== memberId) : [...current, memberId],
    );
  }

  async function saveProgram(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!programMemberId) return;

    const workoutDays = programDraft.workoutDays
      .map((row) => ({
        day: row.day,
        focus: row.focus.trim(),
        exercises: row.exercisesText
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      }))
      .filter((row) => row.focus && row.exercises.length > 0);

    const dietMeals = [
      { title: "Breakfast", items: programDraft.breakfast.split(",").map((item) => item.trim()).filter(Boolean) },
      { title: "Lunch", items: programDraft.lunch.split(",").map((item) => item.trim()).filter(Boolean) },
      { title: "Evening", items: programDraft.evening.split(",").map((item) => item.trim()).filter(Boolean) },
      { title: "Dinner", items: programDraft.dinner.split(",").map((item) => item.trim()).filter(Boolean) },
    ].filter((meal) => meal.items.length > 0);

    try {
      setBusy(true);
      setError(null);
      await postJson("/api/programs", {
        memberId: programMemberId,
        workoutDays,
        trainerNote: programDraft.trainerNote,
        calorieTarget: programDraft.calorieTarget,
        proteinTargetG: programDraft.proteinTargetG,
        waterTargetGlasses: programDraft.waterTargetGlasses,
        dietMeals,
      });
      showToast("Member workout & diet template saved", "success");
      window.location.reload();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save member program";
      setBusy(false);
      setError(message);
      showToast(message, "error");
    }
  }

  async function copyProgramToSelected() {
    if (!programMemberId || copyTargets.length === 0) return;

    try {
      setBusy(true);
      setError(null);
      const result = (await postJson("/api/programs/bulk-copy", {
        sourceMemberId: programMemberId,
        targetMemberIds: copyTargets,
      })) as { copiedTo?: number };
      showToast(`Program copied to ${result.copiedTo ?? copyTargets.length} members`, "success");
      window.location.reload();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to copy program";
      setBusy(false);
      setError(message);
      showToast(message, "error");
    }
  }

  return (
    <section className="module-grid single-col">
      <div className="card kpi-panel trainer-kpi-panel">
        <div className="section-head">
          <h2>Trainer KPI Wall</h2>
          <span className="status-pill low">Accountability view</span>
        </div>
        <div className="kpi-chip-grid">
          <article className="kpi-chip c2">
            <p>Member Coverage</p>
            <strong>{trainerKpi.memberCoveragePct}%</strong>
            <small>Assigned vs total members</small>
          </article>
          <article className="kpi-chip c3">
            <p>Active Client Ratio</p>
            <strong>{trainerKpi.avgActiveRatioPct}%</strong>
            <small>Active assigned clients</small>
          </article>
          <article className="kpi-chip c1">
            <p>Top Revenue Trainer</p>
            <strong>{trainerKpi.topRevenueTrainer?.trainerName ?? "-"}</strong>
            <small>
              Rs {(trainerKpi.topRevenueTrainer?.supplementRevenueInr ?? 0).toLocaleString("en-IN")}
            </small>
          </article>
          <article className="kpi-chip c5">
            <p>Supplement Revenue</p>
            <strong>Rs {trainerKpi.supplementInr.toLocaleString("en-IN")}</strong>
            <small>Total trainer-driven sales</small>
          </article>
        </div>
      </div>

      {role === "owner" ? (
        <form className="card tinted-card t1" onSubmit={addTrainer}>
          <h2>Add Trainer</h2>
          <label>
            Trainer name
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Arjun Singh"
            />
          </label>
          <button type="submit" disabled={busy || !name.trim()}>
            {busy ? "Saving..." : "Add Trainer"}
          </button>
          {error ? <p className="error">{error}</p> : null}
        </form>
      ) : (
        <div className="card tinted-card t1">
          <h2>Trainer Management</h2>
          <p className="muted">Only owner can add trainers. You can view performance data below.</p>
        </div>
      )}

      <form className="card tinted-card t2" onSubmit={saveProgram}>
        <h2>Member Program Builder</h2>
        <p className="muted">Create personalized workout and diet templates for each member.</p>
        <label>
          Member
          <select value={programMemberId} onChange={(e) => loadProgram(e.target.value)}>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.memberCode} - {member.name}
              </option>
            ))}
          </select>
        </label>
        <div className="inline-fields">
          <label>
            Calories target
            <input
              type="number"
              value={programDraft.calorieTarget}
              onChange={(e) =>
                setProgramDraft((x) => ({ ...x, calorieTarget: Number(e.target.value) }))
              }
            />
          </label>
          <label>
            Protein target (g)
            <input
              type="number"
              value={programDraft.proteinTargetG}
              onChange={(e) =>
                setProgramDraft((x) => ({ ...x, proteinTargetG: Number(e.target.value) }))
              }
            />
          </label>
        </div>
        <label>
          Water target (glasses)
          <input
            type="number"
            value={programDraft.waterTargetGlasses}
            onChange={(e) =>
              setProgramDraft((x) => ({ ...x, waterTargetGlasses: Number(e.target.value) }))
            }
          />
        </label>
        <label>
          Trainer note
          <input
            value={programDraft.trainerNote}
            onChange={(e) => setProgramDraft((x) => ({ ...x, trainerNote: e.target.value }))}
            placeholder="Focus on controlled reps and progressive overload."
          />
        </label>

        <h3>Weekly Workout Split</h3>
        <div className="program-grid">
          {programDraft.workoutDays.map((row, index) => (
            <div className="program-day-card" key={row.day}>
              <p>{row.day}</p>
              <input
                placeholder="Focus (Push / Pull / Legs)"
                value={row.focus}
                onChange={(e) =>
                  setProgramDraft((x) => ({
                    ...x,
                    workoutDays: x.workoutDays.map((day, dayIndex) =>
                      dayIndex === index ? { ...day, focus: e.target.value } : day,
                    ),
                  }))
                }
              />
              <input
                placeholder="Exercises (comma separated)"
                value={row.exercisesText}
                onChange={(e) =>
                  setProgramDraft((x) => ({
                    ...x,
                    workoutDays: x.workoutDays.map((day, dayIndex) =>
                      dayIndex === index ? { ...day, exercisesText: e.target.value } : day,
                    ),
                  }))
                }
              />
            </div>
          ))}
        </div>

        <h3>Diet Template</h3>
        <div className="program-grid">
          <label>
            Breakfast (comma separated)
            <input
              value={programDraft.breakfast}
              onChange={(e) => setProgramDraft((x) => ({ ...x, breakfast: e.target.value }))}
            />
          </label>
          <label>
            Lunch (comma separated)
            <input
              value={programDraft.lunch}
              onChange={(e) => setProgramDraft((x) => ({ ...x, lunch: e.target.value }))}
            />
          </label>
          <label>
            Evening (comma separated)
            <input
              value={programDraft.evening}
              onChange={(e) => setProgramDraft((x) => ({ ...x, evening: e.target.value }))}
            />
          </label>
          <label>
            Dinner (comma separated)
            <input
              value={programDraft.dinner}
              onChange={(e) => setProgramDraft((x) => ({ ...x, dinner: e.target.value }))}
            />
          </label>
        </div>

        <button type="submit" disabled={busy || !programMemberId}>
          {busy ? "Saving..." : "Save Program"}
        </button>

        <h3>Copy Template To Multiple Members</h3>
        <p className="muted">Use the current selected member as source template.</p>
        <div className="copy-targets-grid">
          {members
            .filter((member) => member.id !== programMemberId)
            .map((member) => (
              <label key={member.id} className="copy-target-item">
                <input
                  type="checkbox"
                  checked={copyTargets.includes(member.id)}
                  onChange={() => toggleCopyTarget(member.id)}
                />
                <span>
                  {member.memberCode} - {member.name}
                </span>
              </label>
            ))}
        </div>
        <button
          type="button"
          className="secondary-btn"
          disabled={busy || !programMemberId || copyTargets.length === 0}
          onClick={copyProgramToSelected}
        >
          {busy ? "Copying..." : `Copy To Selected (${copyTargets.length})`}
        </button>
        {error ? <p className="error">{error}</p> : null}
      </form>

      <div className="card table-card tinted-card t4">
        <h2>Trainer List</h2>
        <table>
          <thead>
            <tr>
              <th>Trainer</th>
              <th>Assigned Members</th>
              <th>Active Members</th>
              <th>Active Ratio</th>
              <th>Supplement Revenue</th>
            </tr>
          </thead>
          <tbody>
            {trainers.map((trainer) => {
              const snapshot = snapshotByTrainerId.get(trainer.id);
              const ratioPct = pct(snapshot?.activeAssignedMembers ?? 0, snapshot?.assignedMembers ?? 0);
              return (
                <tr key={trainer.id}>
                  <td>{trainer.name}</td>
                  <td>{snapshot?.assignedMembers ?? 0}</td>
                  <td>{snapshot?.activeAssignedMembers ?? 0}</td>
                  <td>
                    <div className="score-cell">
                      <span>{ratioPct}%</span>
                      <div className="score-track">
                        <div className="score-fill" style={{ width: `${ratioPct}%` }} />
                      </div>
                    </div>
                  </td>
                  <td>Rs {(snapshot?.supplementRevenueInr ?? 0).toLocaleString("en-IN")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {trainers.length === 0 ? <p className="muted">No trainers added yet.</p> : null}
      </div>
    </section>
  );
}
