import { NextRequest, NextResponse } from "next/server";
import { leaderboard } from "@/lib/engagement";
import { isValidCheckinToken } from "@/lib/checkin/qr";
import { readStore } from "@/lib/store";
import { normalizeGymId } from "@/lib/tenant";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token")?.trim();
  const gymId = request.nextUrl.searchParams.get("gym")?.trim();

  if (!token || !gymId) {
    return NextResponse.json({ error: "token and gym are required" }, { status: 400 });
  }
  if (!isValidCheckinToken(token)) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const store = await readStore(normalizeGymId(gymId));
  return NextResponse.json({
    ok: true,
    gymName: store.gymName,
    leaderboard: leaderboard(store),
    generatedAt: new Date().toISOString(),
  });
}
