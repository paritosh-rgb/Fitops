import { NextRequest, NextResponse } from "next/server";
import { createMemberSessionToken, MEMBER_SESSION_COOKIE_NAME } from "@/lib/auth/member-session";
import { makeId, readStore, writeStore } from "@/lib/store";
import { normalizeGymId } from "@/lib/tenant";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      gymId?: string;
      memberId?: string;
      password?: string;
      confirmPassword?: string;
      name?: string;
      phone?: string;
    };

    if (!body.gymId || !body.memberId || !body.password || !body.confirmPassword) {
      return NextResponse.json(
        { error: "gymId, memberId, password and confirmPassword are required" },
        { status: 400 },
      );
    }

    const gymId = normalizeGymId(body.gymId);
    const memberCode = body.memberId.trim();
    const password = body.password;

    if (!memberCode) {
      return NextResponse.json({ error: "memberId cannot be empty" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "password must be at least 6 characters" }, { status: 400 });
    }

    if (body.password !== body.confirmPassword) {
      return NextResponse.json({ error: "passwords do not match" }, { status: 400 });
    }

    const store = await readStore(gymId);
    let member = store.members.find(
      (row) => row.memberCode.toLowerCase() === memberCode.toLowerCase(),
    );

    if (!member) {
      const name = body.name?.trim() ?? "";
      const phone = body.phone?.trim() ?? "";
      if (!name || !phone) {
        return NextResponse.json(
          { error: "name and phone are required for new member signup" },
          { status: 400 },
        );
      }

      member = {
        id: makeId("mem"),
        memberCode,
        name,
        phone,
        preferredLanguage: "en",
      };
      store.members.push(member);
    }

    if (store.memberPortalAccounts.some((row) => row.memberId === member.id)) {
      return NextResponse.json({ error: "Member account already exists. Please login." }, { status: 409 });
    }

    store.memberPortalAccounts.push({
      id: makeId("macc"),
      memberId: member.id,
      password,
      createdAt: new Date().toISOString(),
    });

    await writeStore(store, gymId);

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
    const message = error instanceof Error ? error.message : "Member signup failed";
    console.error("Member signup error:", message);
    return NextResponse.json({ error: "Member signup failed. Please try again." }, { status: 500 });
  }
}
