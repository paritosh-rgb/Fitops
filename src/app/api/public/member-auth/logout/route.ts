import { NextResponse } from "next/server";
import { MEMBER_SESSION_COOKIE_NAME } from "@/lib/auth/member-session";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: MEMBER_SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
