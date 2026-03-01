import { NextResponse } from "next/server";
import { buildDashboard } from "@/lib/analytics";
import { readStore } from "@/lib/store";

export async function GET() {
  const store = await readStore();
  return NextResponse.json({ gymName: store.gymName, ...buildDashboard(store) });
}
