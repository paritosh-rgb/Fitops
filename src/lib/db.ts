import postgres, { type Sql } from "postgres";
import type { UserRole } from "@/lib/auth/rbac";
import { envGymId, gymStoreKey } from "@/lib/tenant";

const connectionString = (process.env.SUPABASE_DB_URL ?? "").trim();
let client: Sql | null = null;
let schemaReady = false;
let schemaInitPromise: Promise<void> | null = null;
let dbCooldownUntil = 0;
const connectTimeoutSeconds = Number(process.env.DB_CONNECT_TIMEOUT_SEC ?? "3");
const failureCooldownMs = Number(process.env.DB_FAILURE_COOLDOWN_MS ?? "60000");
const tableNamespace = normalizeNamespace((process.env.APP_DB_NAMESPACE ?? "default").trim());

function normalizeNamespace(value: string): string {
  const normalized = value.toLowerCase().replace(/[^a-z0-9_]/g, "_").replace(/^_+|_+$/g, "");
  return normalized || "default";
}

function tableName(base: "store" | "users"): string {
  if (tableNamespace === "default") return `fitops_${base}`;
  return `fitops_${tableNamespace}_${base}`;
}

export const DB_TABLES = {
  store: tableName("store"),
  users: tableName("users"),
};

function getClient(): Sql {
  if (!connectionString) {
    throw new Error("SUPABASE_DB_URL is not configured");
  }

  if (!client) {
    client = postgres(connectionString, {
      ssl: "require",
      max: 1,
      connect_timeout: Number.isFinite(connectTimeoutSeconds) ? connectTimeoutSeconds : 3,
      idle_timeout: 20,
    });
  }

  return client;
}

export function isDbEnabled(): boolean {
  return Boolean(connectionString) && Date.now() >= dbCooldownUntil;
}

export function markDbFailure(): void {
  const cooldown = Number.isFinite(failureCooldownMs) ? failureCooldownMs : 60000;
  dbCooldownUntil = Date.now() + Math.max(1000, cooldown);
  schemaReady = false;
  schemaInitPromise = null;

  if (client) {
    const activeClient = client;
    client = null;
    void activeClient.end({ timeout: 1 }).catch(() => undefined);
  }
}

export async function ensureDbSchema(): Promise<void> {
  if (!isDbEnabled() || schemaReady) return;
  if (schemaInitPromise) {
    await schemaInitPromise;
    return;
  }

  schemaInitPromise = (async () => {
    const sql = getClient();
    const defaultGymId = envGymId();
    const defaultStoreKey = gymStoreKey(defaultGymId);
    const storeTable = DB_TABLES.store;
    const usersTable = DB_TABLES.users;

    await sql.unsafe(`
    create table if not exists ${storeTable} (
      key text primary key,
      payload jsonb not null,
      updated_at timestamptz not null default now()
    )
  `);

    await sql.unsafe(`
    update ${storeTable}
    set payload = (payload #>> '{}')::jsonb
    where jsonb_typeof(payload) = 'string'
  `);

    await sql.unsafe(`
    insert into ${storeTable} (key, payload)
    select $1, payload
    from ${storeTable}
    where key = 'main'
      and not exists (select 1 from ${storeTable} where key = $1)
  `, [defaultStoreKey]);

    await sql.unsafe(`delete from ${storeTable} where key = 'main'`);

    await sql.unsafe(`
    create table if not exists ${usersTable} (
      username text primary key,
      password text not null,
      role text not null check (role in ('owner', 'front_desk', 'trainer')),
      gym_id text not null default 'fitops-demo',
      created_at timestamptz not null default now()
    )
  `);

    await sql.unsafe(`
    alter table ${usersTable}
    add column if not exists gym_id text not null default 'fitops-demo'
  `);

    await sql.unsafe(`
    update ${usersTable}
    set gym_id = $1
    where coalesce(gym_id, '') = ''
  `, [defaultGymId]);

    const defaultUsername = (process.env.APP_LOGIN_USERNAME ?? "admin@gym.local").trim();
    const defaultPassword = (process.env.APP_LOGIN_PASSWORD ?? "admin123").trim();
    const defaultRole: UserRole = "owner";

    await sql.unsafe(`
    insert into ${usersTable} (username, password, role, gym_id)
    values ($1, $2, $3, $4)
    on conflict (username) do update
      set gym_id = excluded.gym_id
  `, [defaultUsername, defaultPassword, defaultRole, defaultGymId]);

    schemaReady = true;
  })();

  try {
    await schemaInitPromise;
  } catch (error) {
    markDbFailure();
    throw error;
  } finally {
    schemaInitPromise = null;
  }
}

export function dbClient(): Sql {
  return getClient();
}
