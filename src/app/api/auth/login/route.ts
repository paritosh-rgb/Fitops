import { NextRequest, NextResponse } from "next/server";
import {
  createSessionToken,
  envSessionGymId,
  SESSION_COOKIE_NAME,
  validateEnvCredentials,
} from "@/lib/auth/session";
import { getUserByCredentials } from "@/lib/auth/users";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { username?: string; password?: string };

    if (!body.username || !body.password) {
      return NextResponse.json({ error: "username and password are required" }, { status: 400 });
    }

    const isFallbackEnvUser = validateEnvCredentials(body.username, body.password);
    if (isFallbackEnvUser) {
      const sessionToken = createSessionToken({
        username: body.username,
        role: "owner",
        gymId: envSessionGymId(),
      });

      const response = NextResponse.json({ ok: true, role: "owner", gymId: envSessionGymId() });
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

    const user = await getUserByCredentials(body.username, body.password);

    if (!user) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

    const sessionToken = createSessionToken({
      username: user.username,
      role: user.role,
      gymId: user.gymId,
    });

    const response = NextResponse.json({ ok: true, role: user.role, gymId: user.gymId });
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
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed";
    console.error("Login error:", message);
    return NextResponse.json({ error: "Login failed. Please try again." }, { status: 500 });
  }
}
