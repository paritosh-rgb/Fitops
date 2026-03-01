export interface WhatsAppSendResult {
  status: "sent" | "failed";
  provider: "whatsapp" | "simulated";
  messageId?: string;
  error?: string;
}

function normalizeIndianPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("91") && digits.length >= 12) return digits;
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

export async function sendWhatsAppMessage(toPhone: string, message: string): Promise<WhatsAppSendResult> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    return { status: "sent", provider: "simulated" };
  }

  const to = normalizeIndianPhone(toPhone);

  try {
    const response = await fetch(`https://graph.facebook.com/v22.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: message },
      }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: { message?: string } };
      throw new Error(payload.error?.message ?? "WhatsApp API call failed");
    }

    const payload = (await response.json().catch(() => ({}))) as {
      messages?: Array<{ id?: string }>;
    };

    return {
      status: "sent",
      provider: "whatsapp",
      messageId: payload.messages?.[0]?.id,
    };
  } catch (error) {
    return {
      status: "failed",
      provider: "whatsapp",
      error: error instanceof Error ? error.message : "Failed to send message",
    };
  }
}
