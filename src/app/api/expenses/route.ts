import { NextRequest, NextResponse } from "next/server";
import { makeId, readStore, writeStore } from "@/lib/store";

export async function GET() {
  const store = await readStore();
  return NextResponse.json({ expenses: store.expenses });
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    category?: "rent" | "electricity" | "salary" | "maintenance" | "other";
    amountInr?: number;
    note?: string;
    date?: string;
  };

  if (!body.category || !body.amountInr) {
    return NextResponse.json({ error: "category and amountInr are required" }, { status: 400 });
  }

  const store = await readStore();
  store.expenses.push({
    id: makeId("exp"),
    category: body.category,
    amountInr: body.amountInr,
    note: body.note,
    date: body.date ?? new Date().toISOString().slice(0, 10),
  });

  await writeStore(store);
  return NextResponse.json({ ok: true });
}
