import { normalizeGymId } from "@/lib/tenant";

export const MEMBER_SESSION_COOKIE_NAME = "fitops_member_session";

export interface MemberSessionData {
  memberCode: string;
  gymId: string;
}

function memberSessionSecret(): string {
  return (process.env.APP_SESSION_SECRET ?? "dev-secret-change-me").trim();
}

export function createMemberSessionToken(session: MemberSessionData): string {
  const gymId = normalizeGymId(session.gymId);
  return `${session.memberCode}::${gymId}::${memberSessionSecret()}`;
}

export function parseMemberSessionToken(token?: string): MemberSessionData | null {
  if (!token) return null;
  const parts = token.split("::");
  if (parts.length !== 3) return null;

  const [memberCode, gymId, secret] = parts;
  if (!memberCode || !gymId || !secret || secret !== memberSessionSecret()) {
    return null;
  }

  return { memberCode: memberCode.trim(), gymId: normalizeGymId(gymId) };
}
