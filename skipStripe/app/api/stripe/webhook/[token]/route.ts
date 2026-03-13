import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

import { decryptSecret } from "@/lib/crypto";
import { createInvoiceForPayment } from "@/lib/invoice-service";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createStripeClient, mapChargeToPayment } from "@/lib/stripe";

function getAutoCompanyDefaults() {
  return {
    companyName: process.env.AUTO_INVOICE_COMPANY_NAME ?? "Acme Inc.",
    companyAddress:
      process.env.AUTO_INVOICE_COMPANY_ADDRESS ??
      "123 Market Street\nSan Francisco, CA 94105\nUnited States",
    taxId: process.env.AUTO_INVOICE_TAX_ID ?? ""
  };
}

export async function POST(request: NextRequest, context: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await context.params;
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing Stripe signature header" }, { status: 400 });
    }

    const { data: connection, error } = await supabaseAdmin
      .from("stripe_connections")
      .select("user_id, stripe_secret_key, stripe_webhook_secret")
      .eq("webhook_token", token)
      .maybeSingle();

    if (error || !connection?.stripe_webhook_secret) {
      return NextResponse.json({ error: "Webhook configuration not found" }, { status: 404 });
    }

    const webhookSecret = decryptSecret(connection.stripe_webhook_secret);
    const stripeSecret = decryptSecret(connection.stripe_secret_key);
    const rawBody = await request.text();
    const stripe = createStripeClient(stripeSecret);
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Invalid webhook signature" },
        { status: 400 }
      );
    }

    if (event.type !== "charge.succeeded") {
      return NextResponse.json({ received: true, skipped: true });
    }

    const charge = event.data.object as Stripe.Charge;
    const payment = mapChargeToPayment(charge);

    if (!payment) {
      return NextResponse.json({ received: true, skipped: true, reason: "missing_customer_email" });
    }

    const { data: existingInvoice } = await supabaseAdmin
      .from("invoices")
      .select("id")
      .eq("user_id", connection.user_id)
      .eq("payment_id", payment.id)
      .maybeSingle();

    if (existingInvoice) {
      return NextResponse.json({ received: true, duplicate: true });
    }

    await createInvoiceForPayment(connection.user_id, payment, getAutoCompanyDefaults());
    return NextResponse.json({ received: true, created: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Webhook processing failed" },
      { status: 400 }
    );
  }
}
