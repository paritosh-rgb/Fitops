import { promises as fs } from "node:fs";
import path from "node:path";
import { dbClient, ensureDbSchema, isDbEnabled } from "@/lib/db";
import type { UserRole } from "@/lib/auth/rbac";

interface AuthUser {
  username: string;
  password: string;
  role: UserRole;
}

const USERS_FILE = path.join(process.cwd(), "src", "data", "users.json");

async function readUsers(): Promise<AuthUser[]> {
  if (isDbEnabled()) {
    await ensureDbSchema();
    const sql = dbClient();
    const rows = await sql<AuthUser[]>`
      select username, password, role from fitops_users
    `;
    return rows.map((user) => ({
      username: user.username ?? "",
      password: user.password ?? "",
      role: user.role ?? "owner",
    }));
  }

  try {
    const raw = await fs.readFile(USERS_FILE, "utf8");
    const parsed = JSON.parse(raw) as Array<Partial<AuthUser>>;
    return parsed.map((user) => ({
      username: user.username ?? "",
      password: user.password ?? "",
      role: user.role ?? "owner",
    }));
  } catch {
    return [];
  }
}

async function writeUsers(users: AuthUser[]): Promise<void> {
  if (isDbEnabled()) {
    await ensureDbSchema();
    const sql = dbClient();
    await sql`delete from fitops_users`;

    for (const user of users) {
      await sql`
        insert into fitops_users (username, password, role)
        values (${user.username}, ${user.password}, ${user.role})
      `;
    }
    return;
  }

  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), "utf8");
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
  if (isDbEnabled()) {
    await ensureDbSchema();
    const sql = dbClient();
    await sql`
      insert into fitops_users (username, password, role)
      values (${username}, ${password}, ${role})
      on conflict (username) do nothing
    `;
    return;
  }

  const users = await readUsers();
  users.push({ username, password, role });
  await writeUsers(users);
}
