import { NextRequest, NextResponse } from "next/server";
import { isValidCheckinToken } from "@/lib/checkin/qr";
import { addDays, battleScoreForMember, creditsBalance, gymTwinProfile, leaderboard, todayIso } from "@/lib/engagement";
import { makeId, readStore, writeStore } from "@/lib/store";
import { GymStore, Member } from "@/lib/types";
import { normalizeGymId } from "@/lib/tenant";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

const WEEKLY_WORKOUT = [
  { day: "Monday", focus: "Push Strength", exercises: ["Bench Press", "Shoulder Press", "Tricep Dips", "Push-Ups"] },
  { day: "Tuesday", focus: "Pull Strength", exercises: ["Lat Pulldown", "Seated Row", "Bicep Curl", "Face Pull"] },
  { day: "Wednesday", focus: "Leg Day", exercises: ["Squat", "Leg Press", "Walking Lunge", "Calf Raise"] },
  { day: "Thursday", focus: "Core + Conditioning", exercises: ["Plank", "Hanging Knee Raise", "Mountain Climbers", "Battle Ropes"] },
  { day: "Friday", focus: "Upper Hypertrophy", exercises: ["Incline Dumbbell Press", "Lateral Raise", "Cable Row", "Hammer Curl"] },
  { day: "Saturday", focus: "Lower + Cardio", exercises: ["Romanian Deadlift", "Split Squat", "Step-up", "Treadmill Intervals"] },
  { day: "Sunday", focus: "Recovery", exercises: ["Mobility Flow", "Foam Rolling", "Light Walk", "Breathing Drill"] },
] as const;

const DAILY_DIET_PLAN = {
  calorieTarget: 2200,
  proteinTargetG: 130,
  waterTargetGlasses: 12,
  meals: [
    { title: "Breakfast", items: ["Oats + banana", "4 egg whites + 1 whole egg"] },
    { title: "Lunch", items: ["Brown rice", "Dal + grilled chicken/paneer", "Salad"] },
    { title: "Evening", items: ["Whey or sprouts", "Fruit"] },
    { title: "Dinner", items: ["Roti", "Mixed vegetables", "Curd"] },
  ],
};

const REWARD_MAP = {
  7: { rewardType: "discount_5", label: "5% renewal discount" },
  15: { rewardType: "free_shaker", label: "Free shaker" },
  30: { rewardType: "pt_trial", label: "Free PT trial session" },
} as const;

type RewardTarget = 7 | 15 | 30;

function toDate(value: string): Date {
  return new Date(`${value}T00:00:00`);
}

function dayDiff(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / MS_PER_DAY);
}

function attendanceStreak(dates: string[]): number {
  if (!dates.length) return 0;
  const unique = Array.from(new Set(dates)).sort((a, b) => b.localeCompare(a));
  let streak = 1;
  let cursor = toDate(unique[0]);
  for (let index = 1; index < unique.length; index += 1) {
    const nextDate = toDate(unique[index]);
    const gap = dayDiff(nextDate, cursor);
    if (gap !== 1) break;
    streak += 1;
    cursor = nextDate;
  }
  return streak;
}

function normalizePayloadMemberCode(value: string): string {
  return value.trim().toLowerCase();
}

function workoutIndexForToday(): number {
  const day = new Date().getDay();
  return day === 0 ? 6 : day - 1;
}

function dayNameForIndex(index: number): string {
  return WEEKLY_WORKOUT[index]?.day ?? WEEKLY_WORKOUT[0].day;
}

function getRewardTarget(raw: unknown): RewardTarget | null {
  const value = Number(raw);
  if (value === 7 || value === 15 || value === 30) return value;
  return null;
}

function trainerNameFor(member: Member, store: GymStore): string | null {
  if (!member.assignedTrainerId) return null;
  return store.trainers.find((row) => row.id === member.assignedTrainerId)?.name ?? null;
}

function buildMemberStatusPayload(store: GymStore, member: Member, token: string, gymId: string) {
  const membership = store.memberships
    .filter((row) => row.memberId === member.id)
    .sort((a, b) => b.expiryDate.localeCompare(a.expiryDate))[0];
  const plan = membership ? store.plans.find((row) => row.id === membership.planId) : undefined;
  const latestPayment = store.payments
    .filter((row) => row.memberId === member.id)
    .sort((a, b) => b.date.localeCompare(a.date))[0];
  const pendingDuesInr = store.payments
    .filter((row) => row.memberId === member.id && row.status !== "paid")
    .reduce((sum, row) => sum + row.amountInr, 0);
  const attendanceDates = store.attendanceLogs
    .filter((row) => row.memberId === member.id)
    .map((row) => row.date)
    .sort((a, b) => b.localeCompare(a));
  const lastVisitDate = attendanceDates[0] ?? null;
  const currentMonth = new Date().toISOString().slice(0, 7);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoIso = thirtyDaysAgo.toISOString().slice(0, 10);
  const visitsThisMonth = attendanceDates.filter((date) => date.startsWith(currentMonth)).length;
  const visitsLast30Days = attendanceDates.filter(
    (date) => toDate(date).getTime() >= toDate(thirtyDaysAgoIso).getTime(),
  ).length;
  const streakDays = attendanceStreak(attendanceDates);

  let daysToExpiry: number | null = null;
  if (membership) {
    daysToExpiry = dayDiff(new Date(), toDate(membership.expiryDate));
  }

  let recommendation = "Stay consistent this week and keep your momentum high.";
  if (daysToExpiry !== null && daysToExpiry <= 7) {
    recommendation = "Your plan is close to expiry. Renew now to avoid interruption.";
  } else if (visitsLast30Days < 8) {
    recommendation = "Try a 4-day weekly target this month for stronger progress.";
  } else if (streakDays >= 5) {
    recommendation = "Excellent consistency streak. Keep pushing with progressive overload.";
  }

  const trainerName = trainerNameFor(member, store);
  const memberProgram = store.memberPrograms.find((row) => row.memberId === member.id);
  const effectiveWorkout = memberProgram?.workoutDays?.length
    ? memberProgram.workoutDays
    : WEEKLY_WORKOUT;
  const effectiveDietDays = memberProgram?.dietDays?.length
    ? memberProgram.dietDays
    : WEEKLY_WORKOUT.map((day) => ({
        day: day.day,
        meals:
          memberProgram?.dietMeals?.length
            ? memberProgram.dietMeals
            : DAILY_DIET_PLAN.meals,
      }));
  const today = todayIso();
  const todayIndex = workoutIndexForToday();
  const workoutPlan = effectiveWorkout[todayIndex] ?? effectiveWorkout[0];
  const todayDayName = dayNameForIndex(todayIndex);
  const todayDietPlan =
    effectiveDietDays.find((row) => row.day.toLowerCase() === todayDayName.toLowerCase()) ??
    effectiveDietDays[0];
  const workoutLog = store.workoutLogs.find(
    (row) => row.memberId === member.id && row.date === today,
  );
  const completedSet = new Set(workoutLog?.completedExercises ?? []);
  const workoutExercises = workoutPlan.exercises.map((name) => ({
    name,
    completed: completedSet.has(name),
  }));
  const completedCount = workoutExercises.filter((row) => row.completed).length;
  const completionPct = Math.round((completedCount / workoutExercises.length) * 100);
  const hydration = store.hydrationLogs.find((row) => row.memberId === member.id && row.date === today);
  const todayWaterGlasses = hydration?.glasses ?? 0;
  const mealLog = store.mealLogs.find((row) => row.memberId === member.id && row.date === today);
  const consumedMealTitles = mealLog?.consumedMealTitles ?? [];
  const claims = store.rewardClaims.filter((row) => row.memberId === member.id);
  const twin = gymTwinProfile(member.id, store);
  const credits = creditsBalance(member.id, store);
  const memberById = new Map(store.members.map((row) => [row.id, row]));
  const battles = store.streakBattles
    .filter((row) => row.challengerMemberId === member.id || row.opponentMemberId === member.id)
    .map((row) => {
      const opponentId = row.challengerMemberId === member.id ? row.opponentMemberId : row.challengerMemberId;
      const opponent = memberById.get(opponentId);
      const myScore = battleScoreForMember(member.id, store, row.startDate, row.endDate);
      const opponentScore = battleScoreForMember(opponentId, store, row.startDate, row.endDate);
      return {
        id: row.id,
        status: row.status,
        startDate: row.startDate,
        endDate: row.endDate,
        opponentName: opponent?.name ?? "Unknown",
        myScore,
        opponentScore,
      };
    });

  return {
    ok: true,
    gymName: store.gymName,
    member: {
      id: member.id,
      memberCode: member.memberCode,
      name: member.name,
      phone: member.phone,
      preferredLanguage: member.preferredLanguage,
    },
    membership: membership
      ? {
          joinDate: membership.joinDate,
          expiryDate: membership.expiryDate,
          planName: plan?.name ?? "Plan",
          daysToExpiry,
        }
      : null,
    payment: {
      latestStatus: latestPayment?.status ?? "pending",
      pendingDuesInr,
    },
    attendance: {
      lastVisitDate,
      visitsThisMonth,
      visitsLast30Days,
      streakDays,
    },
    trainerName,
    recommendation,
    workout: {
      weeklySplit: effectiveWorkout.map((row) => ({ day: row.day, focus: row.focus })),
      today: {
        day: workoutPlan.day,
        focus: workoutPlan.focus,
        exercises: workoutExercises,
        completionPct,
        trainerNote: memberProgram?.trainerNote
          ? memberProgram.trainerNote
          :
          completionPct === 100
            ? "Great work. You completed all exercises for today."
            : trainerName
              ? `${trainerName} says: finish the core lifts and maintain form.`
              : "Complete your key lifts first, then accessory work.",
      },
    },
    diet: {
      calorieTarget: memberProgram?.calorieTarget ?? DAILY_DIET_PLAN.calorieTarget,
      proteinTargetG: memberProgram?.proteinTargetG ?? DAILY_DIET_PLAN.proteinTargetG,
      waterTargetGlasses: memberProgram?.waterTargetGlasses ?? DAILY_DIET_PLAN.waterTargetGlasses,
      todayWaterGlasses,
      consumedMealTitles,
      day: todayDietPlan?.day ?? todayDayName,
      meals: todayDietPlan?.meals ?? DAILY_DIET_PLAN.meals,
      weeklyPlan: effectiveDietDays.map((row) => ({
        day: row.day,
        mealCount: row.meals.length,
        meals: row.meals,
      })),
      pdfUrl: `/api/public/diet-plan-pdf?memberId=${encodeURIComponent(member.memberCode)}&token=${encodeURIComponent(token)}&gymId=${encodeURIComponent(gymId)}`,
    },
    rewards: {
      currentStreak: streakDays,
      milestones: ([7, 15, 30] as RewardTarget[]).map((target) => ({
        target,
        rewardLabel: REWARD_MAP[target].label,
        unlocked: streakDays >= target,
        claimed: claims.some((row) => row.streakTarget === target),
      })),
    },
    twin,
    sweatCredits: {
      balance: credits,
      redemptions: [
        { code: "pt_15", label: "15 PT minutes", points: 120 },
        { code: "supp_100", label: "Supplement voucher Rs 100", points: 80 },
      ],
    },
    streakBattles: {
      active: battles.filter((row) => row.status === "active"),
      recent: battles.filter((row) => row.status === "completed").slice(0, 3),
      leaderboard: leaderboard(store),
    },
  };
}

async function resolveMember(request: NextRequest, source: "query" | "body") {
  let memberCode = "";
  let token = "";
  let gymId = "";

  if (source === "query") {
    memberCode = request.nextUrl.searchParams.get("memberId")?.trim() ?? "";
    token = request.nextUrl.searchParams.get("token")?.trim() ?? "";
    gymId = request.nextUrl.searchParams.get("gymId")?.trim() ?? "";
  } else {
    const body = (await request.json()) as { memberId?: string; token?: string; gymId?: string };
    memberCode = body.memberId?.trim() ?? "";
    token = body.token?.trim() ?? "";
    gymId = body.gymId?.trim() ?? "";
  }

  if (!memberCode || !token || !gymId) {
    return { error: NextResponse.json({ error: "memberId, token and gymId are required" }, { status: 400 }) };
  }

  if (!isValidCheckinToken(token)) {
    return { error: NextResponse.json({ error: "Invalid check-in token" }, { status: 401 }) };
  }

  const normalizedGymId = normalizeGymId(gymId);
  const store = await readStore(normalizedGymId);
  const member = store.members.find(
    (row) => row.memberCode.toLowerCase() === normalizePayloadMemberCode(memberCode),
  );

  if (!member) {
    return { error: NextResponse.json({ error: "Member not found" }, { status: 404 }) };
  }

  return { memberCode, token, gymId, normalizedGymId, store, member };
}

export async function GET(request: NextRequest) {
  const context = await resolveMember(request, "query");
  if ("error" in context) return context.error;
  return NextResponse.json(
    buildMemberStatusPayload(context.store, context.member, context.token, context.gymId),
  );
}

export async function POST(request: NextRequest) {
  const body = (await request.clone().json()) as {
    memberId?: string;
    token?: string;
    gymId?: string;
    action?: "toggle_exercise" | "set_water" | "set_meal" | "claim_reward" | "create_battle" | "redeem_sweat";
    exerciseName?: string;
    glasses?: number;
    mealTitle?: string;
    consumed?: boolean;
    target?: number;
    opponentMemberCode?: string;
    redemptionCode?: "pt_15" | "supp_100";
  };

  if (!body.action) {
    return NextResponse.json({ error: "action is required" }, { status: 400 });
  }

  const context = await resolveMember(request, "body");
  if ("error" in context) return context.error;

  const today = todayIso();
  let message = "Updated successfully";

  if (body.action === "toggle_exercise") {
    const exerciseName = body.exerciseName?.trim();
    if (!exerciseName) {
      return NextResponse.json({ error: "exerciseName is required" }, { status: 400 });
    }

    const memberProgram = context.store.memberPrograms.find(
      (row) => row.memberId === context.member.id,
    );
    const effectiveWorkout = memberProgram?.workoutDays?.length
      ? memberProgram.workoutDays
      : WEEKLY_WORKOUT;
    const todayPlan = effectiveWorkout[workoutIndexForToday()] ?? effectiveWorkout[0];
    if (!todayPlan?.exercises.some((exercise) => exercise === exerciseName)) {
      return NextResponse.json({ error: "Invalid exercise for today" }, { status: 400 });
    }

    let log = context.store.workoutLogs.find(
      (row) => row.memberId === context.member.id && row.date === today,
    );
    if (!log) {
      log = {
        id: makeId("wlog"),
        memberId: context.member.id,
        date: today,
        completedExercises: [],
      };
      context.store.workoutLogs.push(log);
    }

    if (log.completedExercises.includes(exerciseName)) {
      log.completedExercises = log.completedExercises.filter((name) => name !== exerciseName);
      message = `${exerciseName} marked pending`;
    } else {
      log.completedExercises.push(exerciseName);
      context.store.sweatCreditEvents.push({
        id: makeId("credit"),
        memberId: context.member.id,
        date: today,
        points: 5,
        reason: "workout_complete",
      });
      message = `${exerciseName} marked completed`;
    }
  } else if (body.action === "set_water") {
    const glasses = Math.max(0, Math.min(20, Math.round(Number(body.glasses ?? 0))));
    if (Number.isNaN(glasses)) {
      return NextResponse.json({ error: "glasses must be a number" }, { status: 400 });
    }

    let log = context.store.hydrationLogs.find(
      (row) => row.memberId === context.member.id && row.date === today,
    );
    const before = log?.glasses ?? 0;
    if (!log) {
      log = { id: makeId("hydr"), memberId: context.member.id, date: today, glasses };
      context.store.hydrationLogs.push(log);
    } else {
      log.glasses = glasses;
    }
    const target = 10;
    if (before < target && glasses >= target) {
      context.store.sweatCreditEvents.push({
        id: makeId("credit"),
        memberId: context.member.id,
        date: today,
        points: 4,
        reason: "hydration_target",
      });
    }
    message = `Water intake set to ${glasses} glasses`;
  } else if (body.action === "set_meal") {
    const mealTitle = body.mealTitle?.trim();
    if (!mealTitle) {
      return NextResponse.json({ error: "mealTitle is required" }, { status: 400 });
    }
    const consumed = Boolean(body.consumed);
    let log = context.store.mealLogs.find(
      (row) => row.memberId === context.member.id && row.date === today,
    );
    if (!log) {
      log = {
        id: makeId("meal"),
        memberId: context.member.id,
        date: today,
        consumedMealTitles: [],
      };
      context.store.mealLogs.push(log);
    }
    const normalized = mealTitle.toLowerCase();
    const current = new Set(log.consumedMealTitles.map((title) => title.toLowerCase()));
    if (consumed) {
      current.add(normalized);
    } else {
      current.delete(normalized);
    }
    log.consumedMealTitles = Array.from(current);
    message = consumed ? `${mealTitle} marked eaten` : `${mealTitle} marked pending`;
  } else if (body.action === "claim_reward") {
    const target = getRewardTarget(body.target);
    if (!target) {
      return NextResponse.json({ error: "target must be 7, 15 or 30" }, { status: 400 });
    }

    const streak = attendanceStreak(
      context.store.attendanceLogs
        .filter((row) => row.memberId === context.member.id)
        .map((row) => row.date),
    );
    if (streak < target) {
      return NextResponse.json({ error: "Streak target not achieved yet" }, { status: 400 });
    }

    const alreadyClaimed = context.store.rewardClaims.some(
      (row) => row.memberId === context.member.id && row.streakTarget === target,
    );
    if (alreadyClaimed) {
      return NextResponse.json({ error: "Reward already claimed" }, { status: 409 });
    }

    context.store.rewardClaims.push({
      id: makeId("reward"),
      memberId: context.member.id,
      streakTarget: target,
      rewardType: REWARD_MAP[target].rewardType,
      claimedOn: today,
    });
    message = `${REWARD_MAP[target].label} claimed`;
  } else if (body.action === "create_battle") {
    const opponentCode = body.opponentMemberCode?.trim();
    if (!opponentCode) {
      return NextResponse.json({ error: "opponentMemberCode is required" }, { status: 400 });
    }

    const opponent = context.store.members.find(
      (row) => row.memberCode.toLowerCase() === opponentCode.toLowerCase(),
    );
    if (!opponent) {
      return NextResponse.json({ error: "Opponent member not found" }, { status: 404 });
    }
    if (opponent.id === context.member.id) {
      return NextResponse.json({ error: "Cannot challenge yourself" }, { status: 400 });
    }

    const alreadyActive = context.store.streakBattles.some(
      (row) =>
        row.status === "active" &&
        ((row.challengerMemberId === context.member.id && row.opponentMemberId === opponent.id) ||
          (row.challengerMemberId === opponent.id && row.opponentMemberId === context.member.id)),
    );
    if (alreadyActive) {
      return NextResponse.json({ error: "Battle already active with this member" }, { status: 409 });
    }

    context.store.streakBattles.push({
      id: makeId("battle"),
      challengerMemberId: context.member.id,
      opponentMemberId: opponent.id,
      startDate: today,
      endDate: addDays(today, 6),
      status: "active",
      createdAt: today,
    });
    message = `Battle challenge sent to ${opponent.name}`;
  } else if (body.action === "redeem_sweat") {
    const costMap = { pt_15: 120, supp_100: 80 } as const;
    const redemption = body.redemptionCode;
    if (!redemption || !(redemption in costMap)) {
      return NextResponse.json({ error: "Invalid redemptionCode" }, { status: 400 });
    }

    const cost = costMap[redemption];
    const balance = creditsBalance(context.member.id, context.store);
    if (balance < cost) {
      return NextResponse.json({ error: "Not enough sweat credits" }, { status: 400 });
    }
    context.store.sweatCreditEvents.push({
      id: makeId("credit"),
      memberId: context.member.id,
      date: today,
      points: -cost,
      reason: redemption === "pt_15" ? "redeem_pt_minutes" : "redeem_supplement",
    });
    message = redemption === "pt_15" ? "15 PT minutes redeemed" : "Supplement voucher redeemed";
  }

  for (const battle of context.store.streakBattles) {
    if (battle.status === "completed" || battle.endDate > today) continue;
    const cScore = battleScoreForMember(
      battle.challengerMemberId,
      context.store,
      battle.startDate,
      battle.endDate,
    );
    const oScore = battleScoreForMember(
      battle.opponentMemberId,
      context.store,
      battle.startDate,
      battle.endDate,
    );
    battle.status = "completed";
    if (cScore === oScore) {
      battle.winnerMemberId = undefined;
    } else {
      battle.winnerMemberId = cScore > oScore ? battle.challengerMemberId : battle.opponentMemberId;
    }
  }

  await writeStore(context.store, context.normalizedGymId);

  return NextResponse.json({
    ok: true,
    message,
    status: buildMemberStatusPayload(context.store, context.member, context.token, context.gymId),
  });
}
