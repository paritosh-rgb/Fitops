import postgres, { type Sql } from "postgres";
import type { UserRole } from "@/lib/auth/rbac";
import { envGymId, gymStoreKey } from "@/lib/tenant";

const connectionString = (process.env.SUPABASE_DB_URL ?? "").trim();
let client: Sql | null = null;
let schemaReady = false;
const connectTimeoutSeconds = Number(process.env.DB_CONNECT_TIMEOUT_SEC ?? "3");

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
  return Boolean(connectionString);
}

export async function ensureDbSchema(): Promise<void> {
  if (!isDbEnabled() || schemaReady) return;

  const sql = getClient();
  const defaultGymId = envGymId();
  const defaultStoreKey = gymStoreKey(defaultGymId);

  await sql`
    create table if not exists fitops_store (
      key text primary key,
      payload jsonb not null,
      updated_at timestamptz not null default now()
    )
  `;

  await sql`
    update fitops_store
    set payload = (payload #>> '{}')::jsonb
    where jsonb_typeof(payload) = 'string'
  `;

  await sql`
    insert into fitops_store (key, payload)
    select ${defaultStoreKey}, payload
    from fitops_store
    where key = 'main'
      and not exists (select 1 from fitops_store where key = ${defaultStoreKey})
  `;

  await sql`
    delete from fitops_store where key = 'main'
  `;

  await sql`
    create table if not exists fitops_users (
      username text primary key,
      password text not null,
      role text not null check (role in ('owner', 'front_desk', 'trainer')),
      gym_id text not null default 'fitops-demo',
      created_at timestamptz not null default now()
    )
  `;

  await sql`
    alter table fitops_users
    add column if not exists gym_id text not null default 'fitops-demo'
  `;

  await sql`
    update fitops_users
    set gym_id = ${defaultGymId}
    where coalesce(gym_id, '') = ''
  `;

  const defaultUsername = (process.env.APP_LOGIN_USERNAME ?? "admin@gym.local").trim();
  const defaultPassword = (process.env.APP_LOGIN_PASSWORD ?? "admin123").trim();
  const defaultRole: UserRole = "owner";

  await sql`
    insert into fitops_users (username, password, role, gym_id)
    values (${defaultUsername}, ${defaultPassword}, ${defaultRole}, ${defaultGymId})
    on conflict (username) do update
      set gym_id = excluded.gym_id
  `;

  schemaReady = true;
}

export function dbClient(): Sql {
  return getClient();
}
