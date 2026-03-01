import { NextResponse } from "next/server";
import { sendLeadFollowUp } from "@/lib/growth/revenue";
import { readStore, writeStore } from "@/lib/store";

export async function POST(
  _: Request,
  context: { params: Promise<{ leadId: string }> },
) {
  const { leadId } = await context.params;
  const store = await readStore();
  const lead = store.leads.find((row) => row.id === leadId);

  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  const result = await sendLeadFollowUp(lead);
  if (result.status === "failed") {
    return NextResponse.json({ error: result.error ?? "Failed to send follow-up" }, { status: 502 });
  }

  lead.status = "followed_up";
  lead.followUpSentAt = new Date().toISOString().slice(0, 10);
  await writeStore(store);

  return NextResponse.json({ ok: true, result });
}
