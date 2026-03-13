import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { decryptSecret, signPortalPayload } from "@/lib/crypto";
import { demoPayments, shouldUseDemoPayments } from "@/lib/demo-payments";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { fetchPayments } from "@/lib/stripe";

const demoPortalEmails = new Set(["alex@example.com", "priya@example.com"]);

export async function POST(request: Request) {
  try {
    const demoEmailHeader = request.headers.get("x-demo-email")?.toLowerCase() ?? null;
    const useDemoBypass =
      shouldUseDemoPayments() && !!demoEmailHeader && demoPortalEmails.has(demoEmailHeader);

    let portalUserId = "demo-portal-user";
    let email = demoEmailHeader;

    if (useDemoBypass && email) {
      const payments = demoPayments
        .filter((payment) => payment.customerEmail.toLowerCase() === email)
        .map((payment) => ({
          ...payment,
          connectionId: "demo-connection",
          token: signPortalPayload({
            userId: portalUserId,
            connectionId: "demo-connection",
            payment
          })
        }));

      return NextResponse.json({ payments });
    }

    if (!useDemoBypass) {
      const supabase = await createClient();
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user?.email) {
        return NextResponse.json({ error: "Verify your email with OTP first." }, { status: 401 });
      }

      portalUserId = user.id;
      email = user.email.toLowerCase();
    }

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

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
