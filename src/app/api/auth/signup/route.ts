import { NextRequest, NextResponse } from "next/server";
import { registerUserWithGym, userExists } from "@/lib/auth/users";
import type { UserRole } from "@/lib/auth/rbac";
import { normalizeGymId } from "@/lib/tenant";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      username?: string;
      password?: string;
      confirmPassword?: string;
      role?: UserRole;
      gymId?: string;
    };

    if (!body.username || !body.password || !body.confirmPassword || !body.role || !body.gymId) {
      return NextResponse.json(
        { error: "username, password, confirmPassword, role and gymId are required" },
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

    const gymId = normalizeGymId(body.gymId);

    if (await userExists(username)) {
      return NextResponse.json({ error: "username already exists" }, { status: 409 });
    }

    await registerUserWithGym(username, body.password, body.role, gymId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Signup failed";
    console.error("Signup error:", message);
    return NextResponse.json({ error: "Signup failed. Please try again." }, { status: 500 });
  }
}
