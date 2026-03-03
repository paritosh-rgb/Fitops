import { NextRequest, NextResponse } from "next/server";
import { makeId, readStore, writeStore } from "@/lib/store";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    sourceMemberId?: string;
    targetMemberIds?: string[];
  };

  if (!body.sourceMemberId || !Array.isArray(body.targetMemberIds) || body.targetMemberIds.length === 0) {
    return NextResponse.json(
      { error: "sourceMemberId and targetMemberIds are required" },
      { status: 400 },
    );
  }

  const targetMemberIds = Array.from(new Set(body.targetMemberIds.filter(Boolean))).filter(
    (id) => id !== body.sourceMemberId,
  );
  if (targetMemberIds.length === 0) {
    return NextResponse.json({ error: "Select at least one valid target member" }, { status: 400 });
  }

  const store = await readStore();
  const sourceProgram = store.memberPrograms.find((row) => row.memberId === body.sourceMemberId);
  if (!sourceProgram) {
    return NextResponse.json({ error: "Source member has no saved program" }, { status: 404 });
  }

  const memberIdSet = new Set(store.members.map((member) => member.id));
  const invalidTargets = targetMemberIds.filter((memberId) => !memberIdSet.has(memberId));
  if (invalidTargets.length > 0) {
    return NextResponse.json({ error: "One or more selected members are invalid" }, { status: 400 });
  }

  const now = new Date().toISOString();
  for (const memberId of targetMemberIds) {
    const existing = store.memberPrograms.find((row) => row.memberId === memberId);
    if (existing) {
      existing.workoutDays = sourceProgram.workoutDays.map((day) => ({
        day: day.day,
        focus: day.focus,
        exercises: [...day.exercises],
      }));
      existing.trainerNote = sourceProgram.trainerNote;
      existing.calorieTarget = sourceProgram.calorieTarget;
      existing.proteinTargetG = sourceProgram.proteinTargetG;
      existing.waterTargetGlasses = sourceProgram.waterTargetGlasses;
      existing.dietMeals = sourceProgram.dietMeals.map((meal) => ({
        title: meal.title,
        items: [...meal.items],
      }));
      existing.dietDays = sourceProgram.dietDays?.map((day) => ({
        day: day.day,
        meals: day.meals.map((meal) => ({
          title: meal.title,
          items: [...meal.items],
        })),
      }));
      existing.updatedAt = now;
    } else {
      store.memberPrograms.push({
        id: makeId("prog"),
        memberId,
        workoutDays: sourceProgram.workoutDays.map((day) => ({
          day: day.day,
          focus: day.focus,
          exercises: [...day.exercises],
        })),
        trainerNote: sourceProgram.trainerNote,
        calorieTarget: sourceProgram.calorieTarget,
        proteinTargetG: sourceProgram.proteinTargetG,
        waterTargetGlasses: sourceProgram.waterTargetGlasses,
        dietMeals: sourceProgram.dietMeals.map((meal) => ({
          title: meal.title,
          items: [...meal.items],
        })),
        dietDays: sourceProgram.dietDays?.map((day) => ({
          day: day.day,
          meals: day.meals.map((meal) => ({
            title: meal.title,
            items: [...meal.items],
          })),
        })),
        updatedAt: now,
      });
    }
  }

  await writeStore(store);
  return NextResponse.json({ ok: true, copiedTo: targetMemberIds.length });
}
