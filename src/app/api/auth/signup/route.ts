import { NextRequest, NextResponse } from "next/server";
import { registerUser, userExists } from "@/lib/auth/users";
import type { UserRole } from "@/lib/auth/rbac";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    username?: string;
    password?: string;
    confirmPassword?: string;
    role?: UserRole;
  };

  if (!body.username || !body.password || !body.confirmPassword || !body.role) {
    return NextResponse.json(
      { error: "username, password, confirmPassword and role are required" },
      { status: 400 },
    );
  }

  const username = body.username.trim();
  if (!username) {
    return NextResponse.json({ error: "username cannot be empty" }, { status: 400 });
  }

  if (body.password.length < 6) {
    return NextResponse.json({ error: "password must be at least 6 characters" }, { status: 400 });
  }

  if (body.password !== body.confirmPassword) {
    return NextResponse.json({ error: "passwords do not match" }, { status: 400 });
  }

  if (!["owner", "front_desk", "trainer"].includes(body.role)) {
    return NextResponse.json({ error: "invalid role" }, { status: 400 });
  }

  if (await userExists(username)) {
    return NextResponse.json({ error: "username already exists" }, { status: 409 });
  }

  await registerUser(username, body.password, body.role);
  return NextResponse.json({ ok: true });
}
