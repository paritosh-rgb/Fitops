import { NextRequest, NextResponse } from "next/server";
import { buildDashboard } from "@/lib/analytics";
import { addDays, makeId, readStore, writeStore } from "@/lib/store";

export async function GET() {
  const store = await readStore();
  return NextResponse.json({
    members: store.members,
    memberships: store.memberships,
    plans: store.plans,
    dashboard: buildDashboard(store),
  });
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    memberCode?: string;
    name?: string;
    phone?: string;
    preferredLanguage?: "en" | "hi";
    planId?: string;
    assignedTrainerId?: string;
    paymentStatus?: "paid" | "partial" | "pending";
    paymentMethod?: "cash" | "upi";
  };

  if (!body.memberCode || !body.name || !body.phone || !body.planId) {
    return NextResponse.json(
      { error: "memberCode, name, phone and planId are required" },
      { status: 400 },
    );
  }

  const store = await readStore();
  const plan = store.plans.find((row) => row.id === body.planId);
  if (!plan) {
    return NextResponse.json({ error: "Invalid plan selected" }, { status: 400 });
  }
  const normalizedCode = body.memberCode.trim();
  if (!normalizedCode) {
    return NextResponse.json({ error: "memberCode cannot be empty" }, { status: 400 });
  }
  const codeExists = store.members.some(
    (row) => row.memberCode.toLowerCase() === normalizedCode.toLowerCase(),
  );
  if (codeExists) {
    return NextResponse.json({ error: "Member ID already exists" }, { status: 409 });
  }

  const today = new Date().toISOString().slice(0, 10);
  const memberId = makeId("member");
  const defaultPortalPassword = (process.env.APP_MEMBER_DEFAULT_PASSWORD ?? "fitops@123").trim();

  store.members.push({
    id: memberId,
    memberCode: normalizedCode,
    name: body.name,
    phone: body.phone,
    preferredLanguage: body.preferredLanguage ?? "en",
    assignedTrainerId: body.assignedTrainerId,
  });

  store.memberPortalAccounts.push({
    id: makeId("macc"),
    memberId,
    password: defaultPortalPassword,
    createdAt: new Date().toISOString(),
  });

  store.memberships.push({
    id: makeId("membership"),
    memberId,
    planId: plan.id,
    joinDate: today,
    expiryDate: addDays(today, plan.durationDays),
  });

  if (body.paymentStatus && body.paymentMethod) {
    store.payments.push({
      id: makeId("payment"),
      memberId,
      amountInr: plan.priceInr,
      method: body.paymentMethod,
      status: body.paymentStatus,
      date: today,
    });
  }

  await writeStore(store);
  return NextResponse.json({
    ok: true,
    memberId,
    memberCode: normalizedCode,
    portalPassword: defaultPortalPassword,
  });
}
