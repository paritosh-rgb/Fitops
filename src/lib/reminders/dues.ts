import { GymStore } from "@/lib/types";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

export interface DueReminder {
  memberId: string;
  memberName: string;
  phone: string;
  gymName: string;
  preferredLanguage: "en" | "hi";
  dueAmountInr: number;
  dueType: "pending" | "partial";
  paymentDate: string;
}

export interface ReminderSendResult {
  memberId: string;
  memberName: string;
  phone: string;
  status: "sent" | "failed";
  provider: "whatsapp" | "simulated";
  messageId?: string;
  error?: string;
}

function latestPaymentForMember(memberId: string, store: GymStore) {
  return store.payments
    .filter((row) => row.memberId === memberId)
    .sort((a, b) => b.date.localeCompare(a.date))[0];
}

export function buildDueReminders(store: GymStore): DueReminder[] {
  return store.members
    .map((member) => {
      const payment = latestPaymentForMember(member.id, store);
      if (!payment || payment.status === "paid") return null;

      return {
        memberId: member.id,
        memberName: member.name,
        phone: member.phone,
        gymName: store.gymName,
        preferredLanguage: member.preferredLanguage,
        dueAmountInr: payment.amountInr,
        dueType: payment.status,
        paymentDate: payment.date,
      };
    })
    .filter((row): row is DueReminder => row !== null)
    .sort((a, b) => a.memberName.localeCompare(b.memberName));
}

export function buildDueReminderMessage(reminder: DueReminder): string {
  if (reminder.preferredLanguage === "hi") {
    return `Hi ${reminder.memberName}, aapka pending balance ₹${reminder.dueAmountInr} ${reminder.gymName} mein due hai. Kindly UPI se payment karein to avoid interruption.`;
  }

  return `Hi ${reminder.memberName}, you have a pending balance of ₹${reminder.dueAmountInr} at ${reminder.gymName}. Kindly pay via UPI to avoid interruption.`;
}

export async function sendDueReminder(reminder: DueReminder): Promise<ReminderSendResult> {
  const message = buildDueReminderMessage(reminder);
  const result = await sendWhatsAppMessage(reminder.phone, message);
  if (result.status === "failed") {
    return {
      memberId: reminder.memberId,
      memberName: reminder.memberName,
      phone: reminder.phone,
      status: result.status,
      provider: result.provider,
      error: result.error,
    };
  }

  return {
    memberId: reminder.memberId,
    memberName: reminder.memberName,
    phone: reminder.phone,
    status: result.status,
    provider: result.provider,
    messageId: result.messageId,
  };
}
