import type { UserRole } from "@/lib/auth/rbac";

export const SESSION_COOKIE_NAME = "gym_session";

export interface SessionData {
  username: string;
  role: UserRole;
}

function authConfig() {
  const secret = process.env.APP_SESSION_SECRET ?? "dev-secret-change-me";
  const username = process.env.APP_LOGIN_USERNAME ?? "admin@gym.local";
  const password = process.env.APP_LOGIN_PASSWORD ?? "admin123";

  return { secret, username, password };
}

export function createSessionToken(session: SessionData): string {
  const config = authConfig();
  return `${session.username}::${session.role}::${config.secret}`;
}

export function parseSessionToken(token?: string): SessionData | null {
  if (!token) return null;
  const config = authConfig();
  const [username, role, secret] = token.split("::");

  if (!username || !role || !secret || secret !== config.secret) {
    return null;
  }

  if (role !== "owner" && role !== "front_desk" && role !== "trainer") {
    return null;
  }

  return { username, role };
}

export function isValidSessionToken(token?: string): boolean {
  return Boolean(parseSessionToken(token));
}

export function validateEnvCredentials(username: string, password: string): boolean {
  const config = authConfig();
  return username === config.username && password === config.password;
}
