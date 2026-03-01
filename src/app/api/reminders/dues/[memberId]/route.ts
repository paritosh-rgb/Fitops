import { NextResponse } from "next/server";
import { readStore } from "@/lib/store";
import { buildDueReminders, sendDueReminder } from "@/lib/reminders/dues";

export async function POST(
  _: Request,
  context: { params: Promise<{ memberId: string }> },
) {
  const { memberId } = await context.params;

  const store = await readStore();
  const reminder = buildDueReminders(store).find((row) => row.memberId === memberId);

  if (!reminder) {
    return NextResponse.json({ error: "No due reminder found for member" }, { status: 404 });
  }

  const result = await sendDueReminder(reminder);

  if (result.status === "failed") {
    return NextResponse.json({ error: result.error ?? "Failed to send reminder", result }, { status: 502 });
  }

  return NextResponse.json({ ok: true, result });
}
