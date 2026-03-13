import { NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";

import { getAuthenticatedUser } from "@/lib/auth";
import { encryptSecret } from "@/lib/crypto";
import { getStripeAccountId } from "@/lib/stripe";

const schema = z.object({
  stripeSecretKey: z.string().min(10).optional(),
  stripeWebhookSecret: z.string().min(10).optional().or(z.literal(""))
});

export async function POST(request: Request) {
  try {
    const { user, supabase } = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = schema.parse(await request.json());
    const { data: existingConnection } = await supabase
      .from("stripe_connections")
      .select("webhook_token, stripe_account_id, stripe_secret_key")
      .eq("user_id", user.id)
      .maybeSingle();
    const hasStripeKeyUpdate = Boolean(body.stripeSecretKey);
    const hasWebhookUpdate = body.stripeWebhookSecret !== undefined;

    if (!hasStripeKeyUpdate && !hasWebhookUpdate) {
      return NextResponse.json({ error: "Provide Stripe key or webhook secret." }, { status: 400 });
    }

    if (!hasStripeKeyUpdate && !existingConnection?.stripe_secret_key) {
      return NextResponse.json({ error: "Set Stripe secret key first." }, { status: 400 });
    }

    const accountId = hasStripeKeyUpdate
      ? await getStripeAccountId(body.stripeSecretKey as string)
      : existingConnection?.stripe_account_id;
    const encryptedStripeKey = hasStripeKeyUpdate
      ? encryptSecret(body.stripeSecretKey as string)
      : existingConnection?.stripe_secret_key;

    const { error } = await supabase.from("stripe_connections").upsert(
      {
        user_id: user.id,
        stripe_secret_key: encryptedStripeKey,
        stripe_webhook_secret: hasWebhookUpdate
          ? body.stripeWebhookSecret
            ? encryptSecret(body.stripeWebhookSecret)
            : null
          : undefined,
        stripe_account_id: accountId,
        webhook_token: existingConnection?.webhook_token ?? crypto.randomBytes(24).toString("hex")
      },
      { onConflict: "user_id" }
    );

    if (error) {
      throw error;
    }

    return NextResponse.json({ ok: true, stripeAccountId: accountId });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to connect Stripe" },
      { status: 400 }
    );
  }
}
