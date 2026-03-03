import { promises as fs } from "node:fs";
import path from "node:path";
import { dbClient, DB_TABLES, ensureDbSchema, isDbEnabled } from "@/lib/db";
import type { UserRole } from "@/lib/auth/rbac";
import { envGymId, normalizeGymId } from "@/lib/tenant";

interface AuthUser {
  username: string;
  password: string;
  role: UserRole;
  gymId: string;
}

const SEED_USERS_FILE = path.join(process.cwd(), "src", "data", "users.json");
const RUNTIME_USERS_FILE = process.env.VERCEL
  ? path.join("/tmp", "fitops-users.json")
  : path.join(process.cwd(), "src", "data", "users.runtime.json");

async function readUsers(): Promise<AuthUser[]> {
  if (isDbEnabled()) {
    try {
      await ensureDbSchema();
      const sql = dbClient();
      const rows = await sql.unsafe<AuthUser[]>(
        `select username, password, role, gym_id as "gymId" from ${DB_TABLES.users}`,
      );
      return rows.map((user) => ({
        username: user.username ?? "",
        password: user.password ?? "",
        role: user.role ?? "owner",
        gymId: normalizeGymId(user.gymId),
      }));
    } catch {
      return readUsersFromFiles();
    }
  }

  return readUsersFromFiles();
}

async function readUsersFromFiles(): Promise<AuthUser[]> {
  try {
    const runtimeRaw = await fs.readFile(RUNTIME_USERS_FILE, "utf8");
    const runtimeParsed = JSON.parse(runtimeRaw) as Array<Partial<AuthUser>>;
    return runtimeParsed.map((user) => ({
      username: user.username ?? "",
      password: user.password ?? "",
      role: user.role ?? "owner",
      gymId: normalizeGymId(user.gymId),
    }));
  } catch {
    // Fall through to seed file.
  }

  try {
    const raw = await fs.readFile(SEED_USERS_FILE, "utf8");
    const parsed = JSON.parse(raw) as Array<Partial<AuthUser>>;
    return parsed.map((user) => ({
      username: user.username ?? "",
      password: user.password ?? "",
      role: user.role ?? "owner",
      gymId: normalizeGymId(user.gymId),
    }));
  } catch {
    return [];
  }
}

async function writeUsers(users: AuthUser[]): Promise<void> {
  if (isDbEnabled()) {
    try {
      await ensureDbSchema();
      const sql = dbClient();
      await sql.unsafe(`delete from ${DB_TABLES.users}`);

      for (const user of users) {
        await sql.unsafe(
          `insert into ${DB_TABLES.users} (username, password, role, gym_id)
           values ($1, $2, $3, $4)`,
          [user.username, user.password, user.role, user.gymId],
        );
      }
      return;
    } catch {
      // Fall through to runtime file for degraded mode.
    }
  }

  await fs.writeFile(RUNTIME_USERS_FILE, JSON.stringify(users, null, 2), "utf8");
}

export async function getUserByCredentials(
  username: string,
  password: string,
): Promise<AuthUser | null> {
  const users = await readUsers();
  const matched = users.find(
    (user) => user.username.toLowerCase() === username.toLowerCase() && user.password === password,
  );

  return matched ?? null;
}

export async function userExists(username: string): Promise<boolean> {
  const users = await readUsers();
  return users.some((user) => user.username.toLowerCase() === username.toLowerCase());
}

export async function registerUser(username: string, password: string, role: UserRole): Promise<void> {
  const gymId = envGymId();
  if (isDbEnabled()) {
    try {
      await ensureDbSchema();
      const sql = dbClient();
      await sql.unsafe(
        `insert into ${DB_TABLES.users} (username, password, role, gym_id)
         values ($1, $2, $3, $4)
         on conflict (username) do nothing`,
        [username, password, role, gymId],
      );
      return;
    } catch {
      // Fall through to runtime file for degraded mode.
    }
  }

  const users = await readUsers();
  users.push({ username, password, role, gymId });
  await writeUsers(users);
}

export async function registerUserWithGym(
  username: string,
  password: string,
  role: UserRole,
  gymIdInput: string,
): Promise<void> {
  const gymId = normalizeGymId(gymIdInput);
  if (isDbEnabled()) {
    try {
      await ensureDbSchema();
      const sql = dbClient();
      await sql.unsafe(
        `insert into ${DB_TABLES.users} (username, password, role, gym_id)
         values ($1, $2, $3, $4)
         on conflict (username) do nothing`,
        [username, password, role, gymId],
      );
      return;
    } catch {
      // Fall through to runtime file for degraded mode.
    }
  }

  const users = await readUsers();
  users.push({ username, password, role, gymId });
  await writeUsers(users);
}
