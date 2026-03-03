import { cookies } from "next/headers";
import { SessionData, parseSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import type { UserRole } from "@/lib/auth/rbac";
import { envGymId } from "@/lib/tenant";

export async function getServerSession(): Promise<SessionData> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = parseSessionToken(token);

  if (session) return session;

  return {
    username: "owner",
    role: "owner",
    gymId: envGymId(),
  };
}

export async function getServerSessionRole(): Promise<UserRole> {
  const session = await getServerSession();
  return session.role;
}

export async function getServerSessionGymId(): Promise<string> {
  const session = await getServerSession();
  return session.gymId;
}
