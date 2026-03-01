import { NextRequest, NextResponse } from "next/server";
import { makeId, readStore, writeStore } from "@/lib/store";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ memberId: string }> },
) {
  const { memberId } = await context.params;

  const body = (await request.json()) as {
    amountInr?: number;
    method?: "cash" | "upi";
    status?: "paid" | "partial" | "pending";
    date?: string;
  };

  if (!body.amountInr || !body.method || !body.status) {
    return NextResponse.json(
      { error: "amountInr, method and status are required" },
      { status: 400 },
    );
  }

  const store = await readStore();
  const exists = store.members.some((row) => row.id === memberId);
  if (!exists) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  store.payments.push({
    id: makeId("pay"),
    memberId,
    amountInr: body.amountInr,
    method: body.method,
    status: body.status,
    date: body.date ?? new Date().toISOString().slice(0, 10),
  });

  await writeStore(store);
  return NextResponse.json({ ok: true });
}
