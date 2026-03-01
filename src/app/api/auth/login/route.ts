import { NextRequest, NextResponse } from "next/server";
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  validateEnvCredentials,
} from "@/lib/auth/session";
import { getUserByCredentials } from "@/lib/auth/users";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { username?: string; password?: string };

  if (!body.username || !body.password) {
    return NextResponse.json({ error: "username and password are required" }, { status: 400 });
  }

  const user = await getUserByCredentials(body.username, body.password);
  const isFallbackEnvUser = validateEnvCredentials(body.username, body.password);

  if (!user && !isFallbackEnvUser) {
    return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
  }

  const sessionToken = createSessionToken({
    username: user?.username ?? body.username,
    role: user?.role ?? "owner",
  });

  const response = NextResponse.json({ ok: true, role: user?.role ?? "owner" });
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: sessionToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
