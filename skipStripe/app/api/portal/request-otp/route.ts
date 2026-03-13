import { NextResponse } from "next/server";
import { z } from "zod";

import { demoPayments, shouldUseDemoPayments } from "@/lib/demo-payments";
import { clearPortalSession, generateOtpCode, getOtpExpiryIso, hashOtp } from "@/lib/portal-auth";
import { sendPortalOtpEmail } from "@/lib/mailer";
import { supabaseAdmin } from "@/lib/supabase/admin";

const schema = z.object({
  email: z.string().email()
});

export async function POST(request: Request) {
  try {
    const { email } = schema.parse(await request.json());
    const normalizedEmail = email.toLowerCase();
    const isDemoEmail =
      shouldUseDemoPayments() &&
      demoPayments.some((payment) => payment.customerEmail.toLowerCase() === normalizedEmail);
    const code = isDemoEmail ? "000000" : generateOtpCode();

    await supabaseAdmin.from("portal_otps").delete().eq("email", normalizedEmail).is("consumed_at", null);

    const { error } = await supabaseAdmin.from("portal_otps").insert({
      email: normalizedEmail,
      code_hash: hashOtp(normalizedEmail, code),
      expires_at: getOtpExpiryIso()
    });

    if (error) {
      throw error;
    }

    const mailResult = await sendPortalOtpEmail(normalizedEmail, code);
    const response = NextResponse.json({
      ok: true,
      debugCode: "debugCode" in mailResult ? mailResult.debugCode : undefined
    });
    clearPortalSession(response);
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send OTP" },
      { status: 400 }
    );
  }
}
