import { NextRequest, NextResponse } from "next/server";
import { isValidCheckinToken } from "@/lib/checkin/qr";
import { readStore } from "@/lib/store";
import { normalizeGymId } from "@/lib/tenant";

const DIET_LINES = [
  { title: "Breakfast", text: "Oats + banana, 4 egg whites + 1 whole egg" },
  { title: "Lunch", text: "Brown rice, dal + grilled chicken/paneer, salad" },
  { title: "Evening", text: "Whey or sprouts + fruit" },
  { title: "Dinner", text: "Roti, mixed vegetables, curd" },
];

function escapePdfText(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function buildSimplePdf(lines: string[]): Buffer {
  const contentLines = ["BT", "/F1 12 Tf", "50 780 Td"];
  for (let index = 0; index < lines.length; index += 1) {
    const escaped = escapePdfText(lines[index]);
    contentLines.push(index === 0 ? `(${escaped}) Tj` : `0 -18 Td (${escaped}) Tj`);
  }
  contentLines.push("ET");
  const content = `${contentLines.join("\n")}\n`;

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${Buffer.byteLength(content, "utf8")} >>\nstream\n${content}endstream`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (let index = 0; index < objects.length; index += 1) {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += `${index + 1} 0 obj\n${objects[index]}\nendobj\n`;
  }

  const xrefOffset = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let index = 1; index < offsets.length; index += 1) {
    pdf += `${offsets[index].toString().padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf, "utf8");
}

export async function GET(request: NextRequest) {
  const memberCode = request.nextUrl.searchParams.get("memberId")?.trim();
  const token = request.nextUrl.searchParams.get("token")?.trim();
  const gymId = request.nextUrl.searchParams.get("gymId")?.trim();

  if (!memberCode || !token || !gymId) {
    return NextResponse.json({ error: "memberId, token and gymId are required" }, { status: 400 });
  }

  if (!isValidCheckinToken(token)) {
    return NextResponse.json({ error: "Invalid check-in token" }, { status: 401 });
  }

  const normalizedGymId = normalizeGymId(gymId);
  const store = await readStore(normalizedGymId);
  const member = store.members.find((row) => row.memberCode.toLowerCase() === memberCode.toLowerCase());

  if (!member) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  const trainerName = member.assignedTrainerId
    ? store.trainers.find((row) => row.id === member.assignedTrainerId)?.name
    : undefined;
  const memberProgram = store.memberPrograms.find((row) => row.memberId === member.id);
  const dayIndex = (() => {
    const day = new Date().getDay();
    return day === 0 ? 6 : day - 1;
  })();
  const dayName = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][dayIndex];
  const dietMeals =
    memberProgram?.dietDays?.find((row) => row.day.toLowerCase() === dayName.toLowerCase())?.meals ??
    (memberProgram?.dietMeals?.length
      ? memberProgram.dietMeals
      : DIET_LINES.map((row) => ({ title: row.title, items: row.text.split(",").map((x) => x.trim()) })));
  const calorieTarget = memberProgram?.calorieTarget ?? 2200;
  const proteinTargetG = memberProgram?.proteinTargetG ?? 130;
  const waterTargetGlasses = memberProgram?.waterTargetGlasses ?? 12;
  const lines = [
    `${store.gymName} - Diet Plan`,
    `Member: ${member.name} (${member.memberCode})`,
    `Trainer: ${trainerName ?? "Not assigned"}`,
    `Date: ${new Date().toISOString().slice(0, 10)}`,
    `Day: ${dayName}`,
    "",
    ...dietMeals.map((meal) => `${meal.title}: ${meal.items.join(", ")}`),
    `Water target: ${waterTargetGlasses} glasses`,
    `Calories target: ${calorieTarget} kcal | Protein target: ${proteinTargetG} g`,
  ];

  const pdf = buildSimplePdf(lines);
  const pdfBytes = new Uint8Array(pdf);
  const filename = `${member.memberCode.toLowerCase()}-diet-plan.pdf`;
  return new NextResponse(pdfBytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
