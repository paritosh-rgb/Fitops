import { NextRequest, NextResponse } from "next/server";
import { makeId, readStore, writeStore } from "@/lib/store";

export async function GET() {
  const store = await readStore();
  return NextResponse.json({ leads: store.leads });
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    name?: string;
    phone?: string;
    source?: "walk_in" | "instagram" | "referral" | "other";
  };

  if (!body.name || !body.phone) {
    return NextResponse.json({ error: "name and phone are required" }, { status: 400 });
  }

  const store = await readStore();
  store.leads.push({
    id: makeId("lead"),
    name: body.name,
    phone: body.phone,
    source: body.source ?? "walk_in",
    status: "new",
    createdAt: new Date().toISOString().slice(0, 10),
  });

  await writeStore(store);
  return NextResponse.json({ ok: true });
}
