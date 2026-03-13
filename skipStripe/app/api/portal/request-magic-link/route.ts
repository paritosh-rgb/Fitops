import { NextResponse } from "next/server";
import { z } from "zod";

import { absoluteUrl } from "@/lib/utils";
import { clearPortalSession } from "@/lib/portal-auth";
import { sendPortalMagicLinkEmail } from "@/lib/mailer";
import { supabaseAdmin } from "@/lib/supabase/admin";

const schema = z.object({
  email: z.string().email()
});

async function ensurePortalAuthUser(email: string) {
  const created = await supabaseAdmin.auth.admin.createUser({
    email,
    email_confirm: true
  });

  if (created.error && !created.error.message.toLowerCase().includes("already")) {
    throw created.error;
  }
}

export async function POST(request: Request) {
  try {
    const { email } = schema.parse(await request.json());
    const normalizedEmail = email.toLowerCase();

    await ensurePortalAuthUser(normalizedEmail);

    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: normalizedEmail
    });

    if (error || !data.properties.hashed_token) {
      throw error ?? new Error("Failed to generate magic link");
    }

    const magicLink = absoluteUrl(
      `/api/portal/magic-link?token_hash=${encodeURIComponent(data.properties.hashed_token)}&type=magiclink`
    );
    const mailResult = await sendPortalMagicLinkEmail(normalizedEmail, magicLink);

    const response = NextResponse.json({
      ok: true,
      debugLink: "debugLink" in mailResult ? mailResult.debugLink : undefined
    });
    clearPortalSession(response);
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send magic link" },
      { status: 400 }
    );
  }
}
