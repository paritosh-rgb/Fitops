import { NextRequest, NextResponse } from "next/server";
import { makeId, readStore, writeStore } from "@/lib/store";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ memberId: string }> },
) {
  const { memberId } = await context.params;
  const body = (await request.json()) as { date?: string };

  const store = await readStore();
  const exists = store.members.some((row) => row.id === memberId);
  if (!exists) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  store.attendanceLogs.push({
    id: makeId("att"),
    memberId,
    date: body.date ?? new Date().toISOString().slice(0, 10),
  });

  await writeStore(store);
  return NextResponse.json({ ok: true });
}
