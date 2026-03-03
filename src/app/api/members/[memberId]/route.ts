import { NextRequest, NextResponse } from "next/server";
import { readStore, writeStore } from "@/lib/store";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ memberId: string }> },
) {
  const { memberId } = await context.params;
  const body = (await request.json()) as {
    memberCode?: string;
    name?: string;
    phone?: string;
    preferredLanguage?: "en" | "hi";
    assignedTrainerId?: string;
  };

  const store = await readStore();
  const member = store.members.find((row) => row.id === memberId);
  if (!member) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  if (body.memberCode !== undefined) {
    const normalizedCode = body.memberCode.trim();
    if (!normalizedCode) {
      return NextResponse.json({ error: "memberCode cannot be empty" }, { status: 400 });
    }

    const duplicate = store.members.some(
      (row) => row.id !== memberId && row.memberCode.toLowerCase() === normalizedCode.toLowerCase(),
    );
    if (duplicate) {
      return NextResponse.json({ error: "Member ID already exists" }, { status: 409 });
    }
    member.memberCode = normalizedCode;
  }

  if (body.name !== undefined) {
    const name = body.name.trim();
    if (!name) {
      return NextResponse.json({ error: "name cannot be empty" }, { status: 400 });
    }
    member.name = name;
  }

  if (body.phone !== undefined) {
    const phone = body.phone.trim();
    if (!phone) {
      return NextResponse.json({ error: "phone cannot be empty" }, { status: 400 });
    }
    member.phone = phone;
  }

  if (body.preferredLanguage !== undefined) {
    if (body.preferredLanguage !== "en" && body.preferredLanguage !== "hi") {
      return NextResponse.json({ error: "Invalid preferredLanguage" }, { status: 400 });
    }
    member.preferredLanguage = body.preferredLanguage;
  }

  if (body.assignedTrainerId !== undefined) {
    if (!body.assignedTrainerId) {
      member.assignedTrainerId = undefined;
    } else {
      const trainerExists = store.trainers.some((trainer) => trainer.id === body.assignedTrainerId);
      if (!trainerExists) {
        return NextResponse.json({ error: "Invalid trainer selected" }, { status: 400 });
      }
      member.assignedTrainerId = body.assignedTrainerId;
    }
  }

  await writeStore(store);
  return NextResponse.json({ ok: true, member });
}
