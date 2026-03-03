import { promises as fs } from "node:fs";
import path from "node:path";
import { cookies } from "next/headers";
import { parseSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { dbClient, ensureDbSchema, isDbEnabled } from "@/lib/db";
import { GymStore, Plan } from "@/lib/types";
import { envGymId, gymStoreKey, normalizeGymId } from "@/lib/tenant";

function runtimeDataFile(gymId: string): string {
  const normalizedGymId = normalizeGymId(gymId);
  return process.env.VERCEL
    ? path.join("/tmp", `fitops-store-${normalizedGymId}.json`)
    : path.join(process.cwd(), "src", "data", `seed.runtime.${normalizedGymId}.json`);
}

function defaultPlans(): Plan[] {
  return [
    {
      id: "plan_m_1",
      name: "Monthly",
      type: "monthly",
      durationDays: 30,
      priceInr: 1499,
    },
    {
      id: "plan_q_1",
      name: "Quarterly",
      type: "quarterly",
      durationDays: 90,
      priceInr: 3999,
    },
    {
      id: "plan_y_1",
      name: "Yearly",
      type: "yearly",
      durationDays: 365,
      priceInr: 12999,
    },
  ];
}

function normalizeStore(parsed: Partial<GymStore>): GymStore {
  const base = defaultStore();
  return {
    ...base,
    ...parsed,
    plans: parsed.plans && parsed.plans.length > 0 ? parsed.plans : base.plans,
    memberships: parsed.memberships ?? base.memberships,
    attendanceLogs: parsed.attendanceLogs ?? base.attendanceLogs,
    payments: parsed.payments ?? base.payments,
    trainers: parsed.trainers ?? base.trainers,
    supplementOrders: parsed.supplementOrders ?? base.supplementOrders,
    leads: parsed.leads ?? base.leads,
    referrals: parsed.referrals ?? base.referrals,
    expenses: parsed.expenses ?? base.expenses,
    workoutLogs: parsed.workoutLogs ?? base.workoutLogs,
    hydrationLogs: parsed.hydrationLogs ?? base.hydrationLogs,
    rewardClaims: parsed.rewardClaims ?? base.rewardClaims,
    memberPrograms: parsed.memberPrograms ?? base.memberPrograms,
    sweatCreditEvents: parsed.sweatCreditEvents ?? base.sweatCreditEvents,
    streakBattles: parsed.streakBattles ?? base.streakBattles,
    members:
      (parsed.members ?? base.members).map((member) => ({
        ...member,
        memberCode: member.memberCode ?? member.id,
      })) ?? base.members,
  };
}

function defaultStore(): GymStore {
  return {
    gymName: "FitOps",
    plans: defaultPlans(),
    members: [],
    memberships: [],
    attendanceLogs: [],
    payments: [],
    trainers: [],
    supplementOrders: [],
    leads: [],
    referrals: [],
    expenses: [],
    workoutLogs: [],
    hydrationLogs: [],
    rewardClaims: [],
    memberPrograms: [],
    sweatCreditEvents: [],
    streakBattles: [],
  };
}

export async function readStore(explicitGymId?: string): Promise<GymStore> {
  const gymId = await resolveGymId(explicitGymId);
  const key = gymStoreKey(gymId);

  if (isDbEnabled()) {
    try {
      await ensureDbSchema();
      const sql = dbClient();
      const rows = await sql<{ payload: unknown }[]>`
        select payload from fitops_store where key = ${key} limit 1
      `;

      if (rows.length > 0 && rows[0]?.payload) {
        const payload = rows[0].payload;
        if (typeof payload === "string") {
          return normalizeStore(JSON.parse(payload) as Partial<GymStore>);
        }
        return normalizeStore(payload as Partial<GymStore>);
      }

      const fallback = await readStoreFromFiles(gymId);
      const fallbackPayload = fallback as unknown as Parameters<typeof sql.json>[0];
      await sql`
        insert into fitops_store (key, payload)
        values (${key}, ${sql.json(fallbackPayload)})
        on conflict (key) do update set payload = excluded.payload, updated_at = now()
      `;

      return fallback;
    } catch {
      return readStoreFromFiles(gymId);
    }
  }

  return readStoreFromFiles(gymId);
}

async function readStoreFromFiles(gymId: string): Promise<GymStore> {
  const file = runtimeDataFile(gymId);

  try {
    const runtimeRaw = await fs.readFile(file, "utf8");
    const runtimeParsed = JSON.parse(runtimeRaw) as Partial<GymStore>;
    return normalizeStore(runtimeParsed);
  } catch {
    // Fall through to seed file.
  }

  return defaultStore();
}

export async function writeStore(store: GymStore, explicitGymId?: string): Promise<void> {
  const gymId = await resolveGymId(explicitGymId);
  const key = gymStoreKey(gymId);

  if (isDbEnabled()) {
    try {
      await ensureDbSchema();
      const sql = dbClient();
      const storePayload = store as unknown as Parameters<typeof sql.json>[0];
      await sql`
        insert into fitops_store (key, payload)
        values (${key}, ${sql.json(storePayload)})
        on conflict (key) do update set payload = excluded.payload, updated_at = now()
      `;
      return;
    } catch {
      // Fall through to runtime file for degraded mode.
    }
  }

  await fs.writeFile(runtimeDataFile(gymId), JSON.stringify(store, null, 2), "utf8");
}

export function makeId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
}

export function addDays(dateString: string, days: number): string {
  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

async function resolveGymId(explicitGymId?: string): Promise<string> {
  if (explicitGymId) {
    return normalizeGymId(explicitGymId);
  }

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const session = parseSessionToken(token);
    if (session?.gymId) {
      return normalizeGymId(session.gymId);
    }
  } catch {
    // No request context; use env default.
  }

  return envGymId();
}
