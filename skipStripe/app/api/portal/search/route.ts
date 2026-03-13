import { NextResponse } from "next/server";

import { getPortalSession } from "@/lib/portal-auth";
import { decryptSecret, signPortalPayload } from "@/lib/crypto";
import { demoPayments, shouldUseDemoPayments } from "@/lib/demo-payments";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { fetchPayments } from "@/lib/stripe";

export async function POST() {
  try {
    const portalSession = await getPortalSession();

    if (!portalSession?.email) {
      return NextResponse.json({ error: "Verify your email with OTP first." }, { status: 401 });
    }

    const email = portalSession.email.toLowerCase();
    const portalUserId = `portal:${email}`;

    const { data: connections, error } = await supabaseAdmin
      .from("stripe_connections")
      .select("id, user_id, stripe_secret_key");

    if (error) {
      throw error;
    }

    const payments = [];

    for (const connection of connections ?? []) {
      const matches = await fetchPayments(decryptSecret(connection.stripe_secret_key), email);
      for (const payment of matches) {
        payments.push({
          ...payment,
          connectionId: connection.id,
          token: signPortalPayload({
            userId: connection.user_id,
            connectionId: connection.id,
            payment
          })
        });
      }
    }

    if (!payments.length && shouldUseDemoPayments()) {
      const demoMatches = demoPayments.filter((payment) => payment.customerEmail.toLowerCase() === email);
      for (const payment of demoMatches) {
        payments.push({
          ...payment,
          connectionId: "demo-connection",
          token: signPortalPayload({
            userId: portalUserId,
            connectionId: "demo-connection",
            payment
          })
        });
      }
    }

    return NextResponse.json({ payments });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to search portal payments" },
      { status: 400 }
    );
  }
}
