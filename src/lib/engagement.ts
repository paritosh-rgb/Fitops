import { GymStore, Member } from "@/lib/types";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function toDate(value: string): Date {
  return new Date(`${value}T00:00:00`);
}

function isoDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

function inDateRange(date: string, start: string, end: string): boolean {
  return date >= start && date <= end;
}

export function creditsBalance(memberId: string, store: GymStore): number {
  return store.sweatCreditEvents
    .filter((row) => row.memberId === memberId)
    .reduce((sum, row) => sum + row.points, 0);
}

export function weeklyActivityScore(memberId: string, store: GymStore): number {
  const start = isoDaysAgo(6);
  const end = new Date().toISOString().slice(0, 10);
  const attendanceCount = store.attendanceLogs.filter(
    (row) => row.memberId === memberId && inDateRange(row.date, start, end),
  ).length;
  const workoutCompletions = store.workoutLogs
    .filter((row) => row.memberId === memberId && inDateRange(row.date, start, end))
    .reduce((sum, row) => sum + row.completedExercises.length, 0);
  const hydrationHits = store.hydrationLogs.filter(
    (row) => row.memberId === memberId && inDateRange(row.date, start, end) && row.glasses >= 10,
  ).length;

  return attendanceCount * 20 + workoutCompletions * 2 + hydrationHits * 8;
}

export function gymTwinProfile(memberId: string, store: GymStore): {
  weeklyScore: number;
  level: "Bronze" | "Silver" | "Gold" | "Titan";
  auraColor: string;
  avatarLabel: string;
} {
  const score = weeklyActivityScore(memberId, store);
  if (score >= 180) {
    return { weeklyScore: score, level: "Titan", auraColor: "#f97316", avatarLabel: "Titan Phoenix" };
  }
  if (score >= 120) {
    return { weeklyScore: score, level: "Gold", auraColor: "#f59e0b", avatarLabel: "Gold Panther" };
  }
  if (score >= 70) {
    return { weeklyScore: score, level: "Silver", auraColor: "#60a5fa", avatarLabel: "Silver Wolf" };
  }
  return { weeklyScore: score, level: "Bronze", auraColor: "#22c55e", avatarLabel: "Bronze Rhino" };
}

export function battleScoreForMember(memberId: string, store: GymStore, startDate: string, endDate: string): number {
  const attendance = store.attendanceLogs.filter(
    (row) => row.memberId === memberId && inDateRange(row.date, startDate, endDate),
  ).length;
  const workout = store.workoutLogs
    .filter((row) => row.memberId === memberId && inDateRange(row.date, startDate, endDate))
    .reduce((sum, row) => sum + row.completedExercises.length, 0);
  return attendance * 15 + workout * 2;
}

export function leaderboard(store: GymStore): Array<{
  memberId: string;
  name: string;
  memberCode: string;
  score: number;
}> {
  return store.members
    .map((member: Member) => ({
      memberId: member.id,
      name: member.name,
      memberCode: member.memberCode,
      score: weeklyActivityScore(member.id, store),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 12);
}

export function addDays(dateString: string, days: number): string {
  const date = toDate(dateString);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function dayDiff(from: string, to: string): number {
  return Math.floor((toDate(to).getTime() - toDate(from).getTime()) / MS_PER_DAY);
}
