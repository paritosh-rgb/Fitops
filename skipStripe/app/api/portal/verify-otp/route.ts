import { NextResponse } from "next/server";
import { z } from "zod";

import { attachPortalSession, hashOtp } from "@/lib/portal-auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

const schema = z.object({
  email: z.string().email(),
  code: z.string().regex(/^\d{6}$/)
});

export async function POST(request: Request) {
  try {
    const { email, code } = schema.parse(await request.json());
    const normalizedEmail = email.toLowerCase();

    const { data: otp, error } = await supabaseAdmin
      .from("portal_otps")
      .select("id, code_hash, expires_at, consumed_at")
      .eq("email", normalizedEmail)
      .is("consumed_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!otp) {
      return NextResponse.json({ error: "No active OTP found for this email." }, { status: 400 });
    }

    if (new Date(otp.expires_at).getTime() < Date.now()) {
      return NextResponse.json({ error: "OTP has expired. Request a new code." }, { status: 400 });
    }

    if (otp.code_hash !== hashOtp(normalizedEmail, code)) {
      return NextResponse.json({ error: "Invalid verification code." }, { status: 400 });
    }

    await supabaseAdmin
      .from("portal_otps")
      .update({ consumed_at: new Date().toISOString() })
      .eq("id", otp.id);

    const response = NextResponse.json({ ok: true, email: normalizedEmail });
    attachPortalSession(response, normalizedEmail);
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to verify OTP" },
      { status: 400 }
    );
  }
}
