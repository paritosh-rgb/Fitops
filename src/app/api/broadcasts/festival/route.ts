import { NextRequest, NextResponse } from "next/server";
import { sendFestivalBroadcast } from "@/lib/growth/revenue";
import { readStore } from "@/lib/store";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    festival?: string;
    discount?: string;
    memberIds?: string[];
  };

  if (!body.festival || !body.discount) {
    return NextResponse.json({ error: "festival and discount are required" }, { status: 400 });
  }

  const store = await readStore();
  const result = await sendFestivalBroadcast(
    store,
    body.festival,
    body.discount,
    body.memberIds,
  );

  return NextResponse.json({ ok: result.failed === 0, ...result });
}
