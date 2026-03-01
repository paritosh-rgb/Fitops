import { GymStore, Lead } from "@/lib/types";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

function discountCode(): string {
  return `JOIN24-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

export function leadFollowUpMessage(lead: Lead): string {
  const code = discountCode();
  return `Hi ${lead.name}, thanks for visiting our gym. Join in the next 24 hours and use code ${code} to get a special joining offer.`;
}

export function festivalComebackMessage(memberName: string, festival: string, discount: string): string {
  return `Hi ${memberName}, ${festival} special offer is live. Come back to the gym and renew now to get ${discount}. Reply YES to rejoin.`;
}

export async function sendLeadFollowUp(lead: Lead) {
  return sendWhatsAppMessage(lead.phone, leadFollowUpMessage(lead));
}

export async function sendFestivalBroadcast(
  store: GymStore,
  festival: string,
  discount: string,
  memberIds?: string[],
) {
  const latestMembershipMap = new Map<string, string>();
  for (const m of store.memberships) {
    const existing = latestMembershipMap.get(m.memberId);
    if (!existing || m.expiryDate > existing) {
      latestMembershipMap.set(m.memberId, m.expiryDate);
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  const targets = store.members.filter((member) => {
    if (memberIds && memberIds.length && !memberIds.includes(member.id)) return false;
    const expiry = latestMembershipMap.get(member.id);
    return Boolean(expiry && expiry < today);
  });

  const results = await Promise.all(
    targets.map(async (member) => {
      const send = await sendWhatsAppMessage(
        member.phone,
        festivalComebackMessage(member.name, festival, discount),
      );

      return {
        memberId: member.id,
        memberName: member.name,
        phone: member.phone,
        ...send,
      };
    }),
  );

  return {
    total: targets.length,
    sent: results.filter((r) => r.status === "sent").length,
    failed: results.filter((r) => r.status === "failed").length,
    results,
  };
}
