import type { UserRole } from "@/lib/auth/rbac";
import { envGymId, normalizeGymId } from "@/lib/tenant";

export const SESSION_COOKIE_NAME = "gym_session";

export interface SessionData {
  username: string;
  role: UserRole;
  gymId: string;
}

function authConfig() {
  const secret = (process.env.APP_SESSION_SECRET ?? "dev-secret-change-me").trim();
  const username = (process.env.APP_LOGIN_USERNAME ?? "admin@gym.local").trim();
  const password = (process.env.APP_LOGIN_PASSWORD ?? "admin123").trim();
  const gymId = envGymId();

  return { secret, username, password, gymId };
}

export function createSessionToken(session: SessionData): string {
  const config = authConfig();
  const gymId = normalizeGymId(session.gymId);
  return `${session.username}::${session.role}::${gymId}::${config.secret}`;
}

export function parseSessionToken(token?: string): SessionData | null {
  if (!token) return null;
  const config = authConfig();
  const parts = token.split("::");
  let username = "";
  let role = "";
  let gymId = config.gymId;
  let secret = "";

  if (parts.length >= 4) {
    [username, role, gymId, secret] = parts;
  } else {
    [username, role, secret] = parts;
  }

  if (!username || !role || !secret || secret !== config.secret) {
    return null;
  }

  if (role !== "owner" && role !== "front_desk" && role !== "trainer") {
    return null;
  }

  return { username, role, gymId: normalizeGymId(gymId) };
}

export function isValidSessionToken(token?: string): boolean {
  return Boolean(parseSessionToken(token));
}

export function validateEnvCredentials(username: string, password: string): boolean {
  const config = authConfig();
  return username === config.username && password === config.password;
}

export function envSessionGymId(): string {
  return authConfig().gymId;
}
