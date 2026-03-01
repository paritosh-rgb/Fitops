import { cookies } from "next/headers";
import { parseSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import type { UserRole } from "@/lib/auth/rbac";

export async function getServerSessionRole(): Promise<UserRole> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = parseSessionToken(token);
  return session?.role ?? "owner";
}
