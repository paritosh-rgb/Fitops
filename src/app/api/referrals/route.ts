import { NextRequest, NextResponse } from "next/server";
import { makeId, readStore, writeStore } from "@/lib/store";

export async function GET() {
  const store = await readStore();
  return NextResponse.json({ referrals: store.referrals });
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    referrerMemberId?: string;
    referredName?: string;
    referredPhone?: string;
    joined?: boolean;
    rewardType?: "extension_15_days" | "free_shaker" | "free_tshirt";
  };

  if (!body.referrerMemberId || !body.referredName || !body.referredPhone || !body.rewardType) {
    return NextResponse.json(
      { error: "referrerMemberId, referredName, referredPhone and rewardType are required" },
      { status: 400 },
    );
  }

  const store = await readStore();
  const memberExists = store.members.some((row) => row.id === body.referrerMemberId);

  if (!memberExists) {
    return NextResponse.json({ error: "Referrer member not found" }, { status: 404 });
  }

  store.referrals.push({
    id: makeId("ref"),
    referrerMemberId: body.referrerMemberId,
    referredName: body.referredName,
    referredPhone: body.referredPhone,
    joined: body.joined ?? false,
    rewardType: body.rewardType,
    createdAt: new Date().toISOString().slice(0, 10),
  });

  await writeStore(store);
  return NextResponse.json({ ok: true });
}
