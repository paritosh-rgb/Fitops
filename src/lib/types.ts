export type PlanType = "monthly" | "quarterly" | "yearly";

export type PaymentStatus = "paid" | "partial" | "pending";
export type PaymentMethod = "cash" | "upi";

export interface Plan {
  id: string;
  name: string;
  type: PlanType;
  durationDays: number;
  priceInr: number;
}

export interface AttendanceLog {
  id: string;
  memberId: string;
  date: string;
}

export interface Payment {
  id: string;
  memberId: string;
  amountInr: number;
  method: PaymentMethod;
  status: PaymentStatus;
  date: string;
}

export interface Membership {
  id: string;
  memberId: string;
  planId: string;
  joinDate: string;
  expiryDate: string;
}

export interface SupplementOrder {
  id: string;
  memberId: string;
  trainerId?: string;
  productName: string;
  amountInr: number;
  date: string;
}

export interface Trainer {
  id: string;
  name: string;
}

export interface Member {
  id: string;
  memberCode: string;
  name: string;
  phone: string;
  preferredLanguage: "en" | "hi";
  assignedTrainerId?: string;
}

export interface MemberPortalAccount {
  id: string;
  memberId: string;
  password: string;
  createdAt: string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  source: "walk_in" | "instagram" | "referral" | "other";
  status: "new" | "followed_up" | "converted" | "lost";
  createdAt: string;
  followUpSentAt?: string;
}

export interface Referral {
  id: string;
  referrerMemberId: string;
  referredName: string;
  referredPhone: string;
  joined: boolean;
  rewardType: "extension_15_days" | "free_shaker" | "free_tshirt";
  createdAt: string;
}

export interface Expense {
  id: string;
  category: "rent" | "electricity" | "salary" | "maintenance" | "other";
  amountInr: number;
  note?: string;
  date: string;
}

export interface WorkoutLog {
  id: string;
  memberId: string;
  date: string;
  completedExercises: string[];
}

export interface HydrationLog {
  id: string;
  memberId: string;
  date: string;
  glasses: number;
}

export interface MealLog {
  id: string;
  memberId: string;
  date: string;
  consumedMealTitles: string[];
}

export interface RewardClaim {
  id: string;
  memberId: string;
  streakTarget: 7 | 15 | 30;
  rewardType: "discount_5" | "free_shaker" | "pt_trial";
  claimedOn: string;
}

export interface ProgramDay {
  day: string;
  focus: string;
  exercises: string[];
}

export interface DietMeal {
  title: string;
  items: string[];
}

export interface DietDayPlan {
  day: string;
  meals: DietMeal[];
}

export interface MemberProgram {
  id: string;
  memberId: string;
  workoutDays: ProgramDay[];
  trainerNote?: string;
  calorieTarget: number;
  proteinTargetG: number;
  waterTargetGlasses: number;
  dietMeals: DietMeal[];
  dietDays?: DietDayPlan[];
  updatedAt: string;
}

export interface SweatCreditEvent {
  id: string;
  memberId: string;
  date: string;
  points: number;
  reason:
    | "checkin"
    | "workout_complete"
    | "hydration_target"
    | "redeem_pt_minutes"
    | "redeem_supplement";
}

export interface StreakBattle {
  id: string;
  challengerMemberId: string;
  opponentMemberId: string;
  startDate: string;
  endDate: string;
  status: "active" | "completed";
  winnerMemberId?: string;
  createdAt: string;
}

export interface GymStore {
  gymName: string;
  plans: Plan[];
  members: Member[];
  memberships: Membership[];
  attendanceLogs: AttendanceLog[];
  payments: Payment[];
  trainers: Trainer[];
  supplementOrders: SupplementOrder[];
  leads: Lead[];
  referrals: Referral[];
  expenses: Expense[];
  workoutLogs: WorkoutLog[];
  hydrationLogs: HydrationLog[];
  mealLogs: MealLog[];
  rewardClaims: RewardClaim[];
  memberPrograms: MemberProgram[];
  sweatCreditEvents: SweatCreditEvent[];
  streakBattles: StreakBattle[];
  memberPortalAccounts: MemberPortalAccount[];
}

export interface DashboardMetric {
  totalMembers: number;
  activeMembers: number;
  dueIn7Days: number;
  expiredMembers: number;
  pendingPaymentsInr: number;
  monthlyCollectedInr: number;
  monthlyExpensesInr: number;
  netProfitInr: number;
  inactiveMembers: number;
}

export interface RenewalOpportunity {
  memberId: string;
  memberName: string;
  phone: string;
  expiryDate: string;
  renewalProbabilityScore: number;
  daysToExpiry: number;
  lastAttendanceDate: string | null;
  paymentStatus: PaymentStatus;
}

export interface TrainerSnapshot {
  trainerId: string;
  trainerName: string;
  assignedMembers: number;
  activeAssignedMembers: number;
  supplementRevenueInr: number;
}

export interface DashboardPayload {
  metrics: DashboardMetric;
  renewalPipeline: RenewalOpportunity[];
  inactiveMembers: RenewalOpportunity[];
  trainerSnapshot: TrainerSnapshot[];
}
