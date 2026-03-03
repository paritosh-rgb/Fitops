import { NextRequest, NextResponse } from "next/server";
import { makeId, readStore, writeStore } from "@/lib/store";

export async function GET() {
  const store = await readStore();
  return NextResponse.json({ trainers: store.trainers });
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { name?: string };
  const name = body.name?.trim() ?? "";

  if (!name) {
    return NextResponse.json({ error: "trainer name is required" }, { status: 400 });
  }

  const store = await readStore();
  const duplicate = store.trainers.some((trainer) => trainer.name.toLowerCase() === name.toLowerCase());
  if (duplicate) {
    return NextResponse.json({ error: "trainer already exists" }, { status: 409 });
  }

  const trainerId = makeId("trainer");
  store.trainers.push({ id: trainerId, name });
  await writeStore(store);

  return NextResponse.json({ ok: true, trainerId });
}
