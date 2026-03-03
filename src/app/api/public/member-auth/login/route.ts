import { NextRequest, NextResponse } from "next/server";
import { createMemberSessionToken, MEMBER_SESSION_COOKIE_NAME } from "@/lib/auth/member-session";
import { normalizeGymId } from "@/lib/tenant";
import { readStore } from "@/lib/store";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      gymId?: string;
      memberId?: string;
      password?: string;
    };

    if (!body.gymId || !body.memberId || !body.password) {
      return NextResponse.json({ error: "gymId, memberId and password are required" }, { status: 400 });
    }

    const gymId = normalizeGymId(body.gymId);
    const memberCode = body.memberId.trim();
    const password = body.password;

    const store = await readStore(gymId);
    const member = store.members.find(
      (row) => row.memberCode.toLowerCase() === memberCode.toLowerCase(),
    );

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const account = store.memberPortalAccounts.find((row) => row.memberId === member.id);
    if (!account || account.password !== password) {
      return NextResponse.json({ error: "Invalid member ID or password" }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true, memberCode: member.memberCode, gymId });
    response.cookies.set({
      name: MEMBER_SESSION_COOKIE_NAME,
      value: createMemberSessionToken({ memberCode: member.memberCode, gymId }),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 14,
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Member login failed";
    console.error("Member login error:", message);
    return NextResponse.json({ error: "Member login failed. Please try again." }, { status: 500 });
  }
}
