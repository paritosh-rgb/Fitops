import { NextRequest, NextResponse } from "next/server";
import { makeId, readStore, writeStore } from "@/lib/store";
import type { DietDayPlan, DietMeal, ProgramDay } from "@/lib/types";

export async function GET() {
  const store = await readStore();
  return NextResponse.json({ programs: store.memberPrograms });
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    memberId?: string;
    workoutDays?: ProgramDay[];
    trainerNote?: string;
    calorieTarget?: number;
    proteinTargetG?: number;
    waterTargetGlasses?: number;
    dietMeals?: DietMeal[];
    dietDays?: DietDayPlan[];
  };

  if (!body.memberId) {
    return NextResponse.json({ error: "memberId is required" }, { status: 400 });
  }

  const store = await readStore();
  const memberExists = store.members.some((row) => row.id === body.memberId);
  if (!memberExists) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  const validWorkoutDays =
    body.workoutDays?.filter(
      (day) =>
        Boolean(day.day?.trim()) &&
        Boolean(day.focus?.trim()) &&
        Array.isArray(day.exercises) &&
        day.exercises.length > 0,
    ) ?? [];

  const validDietMeals =
    body.dietMeals?.filter(
      (meal) => Boolean(meal.title?.trim()) && Array.isArray(meal.items) && meal.items.length > 0,
    ) ?? [];

  const validDietDays =
    body.dietDays
      ?.map((day) => ({
        day: day.day?.trim() ?? "",
        meals:
          day.meals?.filter(
            (meal) => Boolean(meal.title?.trim()) && Array.isArray(meal.items) && meal.items.length > 0,
          ) ?? [],
      }))
      .filter((day) => day.day && day.meals.length > 0) ?? [];

  if (validWorkoutDays.length === 0) {
    return NextResponse.json({ error: "At least one workout day is required" }, { status: 400 });
  }

  if (validDietMeals.length === 0 && validDietDays.length === 0) {
    return NextResponse.json({ error: "At least one diet meal/day is required" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const calorieTarget = Math.max(1000, Math.min(5000, Math.round(Number(body.calorieTarget ?? 2200))));
  const proteinTargetG = Math.max(30, Math.min(300, Math.round(Number(body.proteinTargetG ?? 130))));
  const waterTargetGlasses = Math.max(
    4,
    Math.min(20, Math.round(Number(body.waterTargetGlasses ?? 12))),
  );

  const existing = store.memberPrograms.find((row) => row.memberId === body.memberId);
  if (existing) {
    existing.workoutDays = validWorkoutDays.map((day) => ({
      day: day.day.trim(),
      focus: day.focus.trim(),
      exercises: day.exercises.map((name) => name.trim()).filter(Boolean),
    }));
    existing.trainerNote = body.trainerNote?.trim() || undefined;
    existing.calorieTarget = calorieTarget;
    existing.proteinTargetG = proteinTargetG;
    existing.waterTargetGlasses = waterTargetGlasses;
    existing.dietMeals = validDietMeals.map((meal) => ({
      title: meal.title.trim(),
      items: meal.items.map((item) => item.trim()).filter(Boolean),
    }));
    existing.dietDays = validDietDays.map((day) => ({
      day: day.day,
      meals: day.meals.map((meal) => ({
        title: meal.title.trim(),
        items: meal.items.map((item) => item.trim()).filter(Boolean),
      })),
    }));
    existing.updatedAt = now;
  } else {
    store.memberPrograms.push({
      id: makeId("prog"),
      memberId: body.memberId,
      workoutDays: validWorkoutDays.map((day) => ({
        day: day.day.trim(),
        focus: day.focus.trim(),
        exercises: day.exercises.map((name) => name.trim()).filter(Boolean),
      })),
      trainerNote: body.trainerNote?.trim() || undefined,
      calorieTarget,
      proteinTargetG,
      waterTargetGlasses,
      dietMeals: validDietMeals.map((meal) => ({
        title: meal.title.trim(),
        items: meal.items.map((item) => item.trim()).filter(Boolean),
      })),
      dietDays: validDietDays.map((day) => ({
        day: day.day,
        meals: day.meals.map((meal) => ({
          title: meal.title.trim(),
          items: meal.items.map((item) => item.trim()).filter(Boolean),
        })),
      })),
      updatedAt: now,
    });
  }

  await writeStore(store);
  return NextResponse.json({ ok: true });
}
