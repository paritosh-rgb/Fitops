import { NextRequest, NextResponse } from "next/server";
import { addDays, makeId, readStore, writeStore } from "@/lib/store";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ memberId: string }> },
) {
  const { memberId } = await context.params;
  const body = (await request.json()) as {
    planId?: string;
    paymentMethod?: "cash" | "upi";
    paymentStatus?: "paid" | "partial" | "pending";
  };

  if (!body.planId) {
    return NextResponse.json({ error: "planId is required" }, { status: 400 });
  }

  const store = await readStore();
  const plan = store.plans.find((row) => row.id === body.planId);
  if (!plan) {
    return NextResponse.json({ error: "Invalid plan selected" }, { status: 400 });
  }

  const member = store.members.find((row) => row.id === memberId);
  if (!member) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  const today = new Date().toISOString().slice(0, 10);
  store.memberships.push({
    id: makeId("membership"),
    memberId,
    planId: plan.id,
    joinDate: today,
    expiryDate: addDays(today, plan.durationDays),
  });

  if (body.paymentMethod && body.paymentStatus) {
    store.payments.push({
      id: makeId("pay"),
      memberId,
      amountInr: plan.priceInr,
      method: body.paymentMethod,
      status: body.paymentStatus,
      date: today,
    });
  }

  await writeStore(store);
  return NextResponse.json({ ok: true });
}
