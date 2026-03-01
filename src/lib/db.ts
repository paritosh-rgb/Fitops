import postgres, { type Sql } from "postgres";
import type { UserRole } from "@/lib/auth/rbac";

const connectionString = process.env.SUPABASE_DB_URL ?? "";
let client: Sql | null = null;
let schemaReady = false;

function getClient(): Sql {
  if (!connectionString) {
    throw new Error("SUPABASE_DB_URL is not configured");
  }

  if (!client) {
    client = postgres(connectionString, {
      ssl: "require",
      max: 1,
      connect_timeout: 10,
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

  await sql`
    create table if not exists fitops_store (
      key text primary key,
      payload jsonb not null,
      updated_at timestamptz not null default now()
    )
  `;

  await sql`
    create table if not exists fitops_users (
      username text primary key,
      password text not null,
      role text not null check (role in ('owner', 'front_desk', 'trainer')),
      created_at timestamptz not null default now()
    )
  `;

  const defaultUsername = process.env.APP_LOGIN_USERNAME ?? "admin@gym.local";
  const defaultPassword = process.env.APP_LOGIN_PASSWORD ?? "admin123";
  const defaultRole: UserRole = "owner";

  await sql`
    insert into fitops_users (username, password, role)
    values (${defaultUsername}, ${defaultPassword}, ${defaultRole})
    on conflict (username) do nothing
  `;

  schemaReady = true;
}

export function dbClient(): Sql {
  return getClient();
}
