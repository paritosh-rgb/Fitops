import { promises as fs } from "node:fs";
import path from "node:path";
import { dbClient, ensureDbSchema, isDbEnabled } from "@/lib/db";
import { GymStore } from "@/lib/types";

const DATA_FILE = path.join(process.cwd(), "src", "data", "seed.json");

function normalizeStore(parsed: Partial<GymStore>): GymStore {
  const base = defaultStore();
  return {
    ...base,
    ...parsed,
    plans: parsed.plans ?? base.plans,
    memberships: parsed.memberships ?? base.memberships,
    attendanceLogs: parsed.attendanceLogs ?? base.attendanceLogs,
    payments: parsed.payments ?? base.payments,
    trainers: parsed.trainers ?? base.trainers,
    supplementOrders: parsed.supplementOrders ?? base.supplementOrders,
    leads: parsed.leads ?? base.leads,
    referrals: parsed.referrals ?? base.referrals,
    expenses: parsed.expenses ?? base.expenses,
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
    plans: [],
    members: [],
    memberships: [],
    attendanceLogs: [],
    payments: [],
    trainers: [],
    supplementOrders: [],
    leads: [],
    referrals: [],
    expenses: [],
  };
}

export async function readStore(): Promise<GymStore> {
  if (isDbEnabled()) {
    try {
      await ensureDbSchema();
      const sql = dbClient();
      const rows = await sql<{ payload: Partial<GymStore> }[]>`
        select payload from fitops_store where key = 'main' limit 1
      `;

      if (rows.length > 0 && rows[0]?.payload) {
        return normalizeStore(rows[0].payload);
      }

      const fallback = await readStoreFromFile();
      const payloadJson = JSON.stringify(fallback);
      await sql`
        insert into fitops_store (key, payload)
        values ('main', ${payloadJson}::jsonb)
        on conflict (key) do update set payload = excluded.payload, updated_at = now()
      `;

      return fallback;
    } catch {
      return readStoreFromFile();
    }
  }

  return readStoreFromFile();
}

async function readStoreFromFile(): Promise<GymStore> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<GymStore>;
    return normalizeStore(parsed);
  } catch {
    return defaultStore();
  }
}

export async function writeStore(store: GymStore): Promise<void> {
  if (isDbEnabled()) {
    await ensureDbSchema();
    const sql = dbClient();
    const payloadJson = JSON.stringify(store);
    await sql`
      insert into fitops_store (key, payload)
      values ('main', ${payloadJson}::jsonb)
      on conflict (key) do update set payload = excluded.payload, updated_at = now()
    `;
    return;
  }

  await fs.writeFile(DATA_FILE, JSON.stringify(store, null, 2), "utf8");
}

export function makeId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
}

export function addDays(dateString: string, days: number): string {
  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}
