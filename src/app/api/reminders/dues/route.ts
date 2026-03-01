import { NextResponse } from "next/server";
import { readStore } from "@/lib/store";
import { buildDueReminders, sendDueReminder } from "@/lib/reminders/dues";

export async function GET() {
  const store = await readStore();
  const reminders = buildDueReminders(store);
  return NextResponse.json({ reminders, total: reminders.length });
}

export async function POST() {
  const store = await readStore();
  const reminders = buildDueReminders(store);

  const results = await Promise.all(reminders.map((reminder) => sendDueReminder(reminder)));
  const sent = results.filter((row) => row.status === "sent").length;
  const failed = results.length - sent;

  return NextResponse.json({
    ok: failed === 0,
    total: reminders.length,
    sent,
    failed,
    results,
  });
}
