import { NextRequest, NextResponse } from "next/server";
import { isValidCheckinToken } from "@/lib/checkin/qr";
import { makeId, readStore, writeStore } from "@/lib/store";
import { normalizeGymId } from "@/lib/tenant";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { memberId?: string; token?: string; gymId?: string };

  if (!body.memberId || !body.token || !body.gymId) {
    return NextResponse.json({ error: "memberId, token and gymId are required" }, { status: 400 });
  }

  if (!isValidCheckinToken(body.token)) {
    return NextResponse.json({ error: "Invalid check-in token" }, { status: 401 });
  }

  const normalizedCode = body.memberId.trim().toLowerCase();
  const gymId = normalizeGymId(body.gymId);
  const store = await readStore(gymId);
  const member = store.members.find((row) => row.memberCode.toLowerCase() === normalizedCode);
  if (!member) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  const today = new Date().toISOString().slice(0, 10);
  const alreadyMarked = store.attendanceLogs.some(
    (row) => row.memberId === member.id && row.date === today,
  );

  if (!alreadyMarked) {
    store.attendanceLogs.push({
      id: makeId("att"),
      memberId: member.id,
      date: today,
    });
    store.sweatCreditEvents.push({
      id: makeId("credit"),
      memberId: member.id,
      date: today,
      points: 10,
      reason: "checkin",
    });
    await writeStore(store, gymId);
  }

  return NextResponse.json({
    ok: true,
    alreadyMarked,
    member: { id: member.id, memberCode: member.memberCode, name: member.name },
    date: today,
  });
}
