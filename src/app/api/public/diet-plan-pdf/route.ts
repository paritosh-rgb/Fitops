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

function wrapText(text: string, maxChars = 74): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxChars) {
      current = candidate;
      continue;
    }
    if (current) lines.push(current);
    current = word;
  }
  if (current) lines.push(current);
  return lines.length > 0 ? lines : [text];
}

function drawText(
  commands: string[],
  text: string,
  x: number,
  y: number,
  font: "F1" | "F2",
  size: number,
  colorRgb = "0 0 0",
) {
  commands.push("BT");
  commands.push(`/${font} ${size} Tf`);
  commands.push(`${colorRgb} rg`);
  commands.push(`1 0 0 1 ${x} ${y} Tm`);
  commands.push(`(${escapePdfText(text)}) Tj`);
  commands.push("ET");
}

function drawRect(
  commands: string[],
  x: number,
  y: number,
  width: number,
  height: number,
  fillRgb: string,
  strokeRgb?: string,
) {
  commands.push(`${fillRgb} rg`);
  commands.push(`${x} ${y} ${width} ${height} re f`);
  if (strokeRgb) {
    commands.push(`${strokeRgb} RG`);
    commands.push(`${x} ${y} ${width} ${height} re S`);
  }
}

function buildStyledPdf(data: {
  gymName: string;
  memberName: string;
  memberCode: string;
  trainerName: string;
  dayName: string;
  dateIso: string;
  calorieTarget: number;
  proteinTargetG: number;
  waterTargetGlasses: number;
  meals: Array<{ title: string; items: string[] }>;
}): Buffer {
  const commands: string[] = [];
  const left = 44;
  const pageWidth = 612;
  const usableWidth = pageWidth - left * 2;

  // Header band
  drawRect(commands, 32, 710, 548, 64, "0.07 0.22 0.56");
  drawText(commands, `${data.gymName}  Diet Export`, 48, 748, "F2", 18, "1 1 1");
  drawText(commands, `Generated: ${data.dateIso}`, 48, 730, "F1", 11, "0.86 0.92 1");

  // Member profile card
  drawRect(commands, left, 648, usableWidth, 52, "0.96 0.98 1", "0.78 0.85 0.98");
  drawText(commands, `Member: ${data.memberName} (${data.memberCode})`, 56, 680, "F2", 12, "0.1 0.2 0.35");
  drawText(commands, `Trainer: ${data.trainerName}    Day: ${data.dayName}`, 56, 662, "F1", 11, "0.25 0.35 0.5");

  // Target chips
  drawRect(commands, 44, 608, 168, 28, "0.89 0.96 0.9");
  drawRect(commands, 222, 608, 168, 28, "0.92 0.95 1");
  drawRect(commands, 400, 608, 168, 28, "1 0.95 0.87");
  drawText(commands, `Calories: ${data.calorieTarget} kcal`, 54, 617, "F2", 10, "0.12 0.4 0.2");
  drawText(commands, `Protein: ${data.proteinTargetG} g`, 232, 617, "F2", 10, "0.11 0.3 0.56");
  drawText(commands, `Water: ${data.waterTargetGlasses} glasses`, 410, 617, "F2", 10, "0.52 0.34 0.02");

  drawText(commands, "Daily Meal Plan", 44, 584, "F2", 14, "0.1 0.22 0.47");
  commands.push("0.7 0.78 0.93 RG");
  commands.push("44 578 m 568 578 l S");

  let y = 554;
  for (const meal of data.meals) {
    drawText(commands, meal.title, 50, y, "F2", 12, "0.12 0.2 0.35");
    y -= 16;
    for (const item of meal.items) {
      for (const line of wrapText(item, 74)) {
        drawText(commands, `- ${line}`, 58, y, "F1", 11, "0.2 0.26 0.34");
        y -= 14;
      }
    }
    y -= 8;
    if (y < 92) break;
  }

  // Footer block
  drawRect(commands, 44, 48, 524, 30, "0.95 0.97 1");
  drawText(commands, "Powered by FitOps  Stay consistent, hydrate and complete your workout set.", 52, 59, "F1", 9, "0.22 0.3 0.44");

  const content = `${commands.join("\n")}\n`;

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
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
  const pdf = buildStyledPdf({
    gymName: store.gymName,
    memberName: member.name,
    memberCode: member.memberCode,
    trainerName: trainerName ?? "Not assigned",
    dayName,
    dateIso: new Date().toISOString().slice(0, 10),
    calorieTarget,
    proteinTargetG,
    waterTargetGlasses,
    meals: dietMeals,
  });
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
