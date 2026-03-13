import { NextResponse } from "next/server";
import { z } from "zod";

import { getAuthenticatedUser } from "@/lib/auth";
import { encryptSecret } from "@/lib/crypto";

const schema = z.object({
  stripeSecretKey: z.string().min(10)
});

export async function POST(request: Request) {
  try {
    const { user, supabase } = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = schema.parse(await request.json());

    const { error } = await supabase.from("stripe_connections").upsert(
      {
        user_id: user.id,
        stripe_secret_key: encryptSecret(body.stripeSecretKey)
      },
      { onConflict: "user_id" }
    );

    if (error) {
      throw error;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to connect Stripe" },
      { status: 400 }
    );
  }
}
