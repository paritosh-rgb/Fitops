import {
  DashboardPayload,
  GymStore,
  Membership,
  PaymentStatus,
  RenewalOpportunity,
  TrainerSnapshot,
} from "@/lib/types";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function toDate(value: string): Date {
  return new Date(`${value}T00:00:00`);
}

function dayDiff(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / MS_PER_DAY);
}

function mostRecentAttendance(memberId: string, store: GymStore): string | null {
  const visits = store.attendanceLogs
    .filter((row) => row.memberId === memberId)
    .sort((a, b) => b.date.localeCompare(a.date));

  return visits[0]?.date ?? null;
}

function getCurrentMembership(memberId: string, store: GymStore): Membership | undefined {
  return store.memberships
    .filter((row) => row.memberId === memberId)
    .sort((a, b) => b.expiryDate.localeCompare(a.expiryDate))[0];
}

function paymentStatus(memberId: string, store: GymStore): PaymentStatus {
  const rows = store.payments
    .filter((row) => row.memberId === memberId)
    .sort((a, b) => b.date.localeCompare(a.date));

  return rows[0]?.status ?? "pending";
}

export function renewalProbabilityScore(memberId: string, store: GymStore): number {
  const lastVisit = mostRecentAttendance(memberId, store);
  const lastPaymentStatus = paymentStatus(memberId, store);
  const today = new Date();

  let attendanceScore = 10;
  if (lastVisit) {
    const daysInactive = dayDiff(toDate(lastVisit), today);
    if (daysInactive <= 2) attendanceScore = 40;
    else if (daysInactive <= 7) attendanceScore = 30;
    else if (daysInactive <= 14) attendanceScore = 20;
  }

  const paymentDiscipline =
    lastPaymentStatus === "paid" ? 25 : lastPaymentStatus === "partial" ? 14 : 4;

  const membership = getCurrentMembership(memberId, store);
  let recency = 8;
  if (membership) {
    const daysToExpiry = dayDiff(today, toDate(membership.expiryDate));
    if (daysToExpiry >= 7) recency = 20;
    else if (daysToExpiry >= 0) recency = 14;
    else if (daysToExpiry >= -7) recency = 10;
    else recency = 4;
  }

  const trainerEngagement = store.members.find((m) => m.id === memberId)?.assignedTrainerId
    ? 15
    : 8;

  return Math.max(0, Math.min(100, attendanceScore + paymentDiscipline + recency + trainerEngagement));
}

function renewalOpportunity(memberId: string, store: GymStore): RenewalOpportunity | null {
  const member = store.members.find((m) => m.id === memberId);
  const membership = getCurrentMembership(memberId, store);
  if (!member || !membership) return null;

  const today = new Date();
  const expiry = toDate(membership.expiryDate);

  return {
    memberId,
    memberName: member.name,
    phone: member.phone,
    expiryDate: membership.expiryDate,
    renewalProbabilityScore: renewalProbabilityScore(memberId, store),
    daysToExpiry: dayDiff(today, expiry),
    lastAttendanceDate: mostRecentAttendance(memberId, store),
    paymentStatus: paymentStatus(memberId, store),
  };
}

export function buildDashboard(store: GymStore): DashboardPayload {
  const today = new Date();

  const opportunities = store.members
    .map((m) => renewalOpportunity(m.id, store))
    .filter((row): row is RenewalOpportunity => row !== null)
    .sort((a, b) => a.daysToExpiry - b.daysToExpiry);

  const inactiveMembers = opportunities.filter((row) => {
    if (!row.lastAttendanceDate) return true;
    const inactiveDays = dayDiff(toDate(row.lastAttendanceDate), today);
    return inactiveDays > 7;
  });

  const dueIn7Days = opportunities.filter(
    (row) => row.daysToExpiry >= 0 && row.daysToExpiry <= 7,
  ).length;

  const expiredMembers = opportunities.filter((row) => row.daysToExpiry < 0).length;
  const activeMembers = opportunities.filter((row) => row.daysToExpiry >= 0).length;

  const pendingPaymentsInr = store.payments
    .filter((row) => row.status !== "paid")
    .reduce((sum, row) => sum + row.amountInr, 0);

  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthlyCollectedInr = store.payments
    .filter((row) => row.status === "paid" && row.date.startsWith(currentMonth))
    .reduce((sum, row) => sum + row.amountInr, 0);
  const monthlyExpensesInr = store.expenses
    .filter((row) => row.date.startsWith(currentMonth))
    .reduce((sum, row) => sum + row.amountInr, 0);
  const netProfitInr = monthlyCollectedInr - monthlyExpensesInr;

  const trainerSnapshot: TrainerSnapshot[] = store.trainers.map((trainer) => {
    const assignedMemberIds = new Set(
      store.members.filter((m) => m.assignedTrainerId === trainer.id).map((m) => m.id),
    );

    const activeAssignedMembers = opportunities.filter(
      (row) => assignedMemberIds.has(row.memberId) && row.daysToExpiry >= 0,
    ).length;

    const supplementRevenueInr = store.supplementOrders
      .filter((row) => row.trainerId === trainer.id)
      .reduce((sum, row) => sum + row.amountInr, 0);

    return {
      trainerId: trainer.id,
      trainerName: trainer.name,
      assignedMembers: assignedMemberIds.size,
      activeAssignedMembers,
      supplementRevenueInr,
    };
  });

  return {
    metrics: {
      totalMembers: store.members.length,
      activeMembers,
      dueIn7Days,
      expiredMembers,
      pendingPaymentsInr,
      monthlyCollectedInr,
      monthlyExpensesInr,
      netProfitInr,
      inactiveMembers: inactiveMembers.length,
    },
    renewalPipeline: opportunities,
    inactiveMembers,
    trainerSnapshot,
  };
}
