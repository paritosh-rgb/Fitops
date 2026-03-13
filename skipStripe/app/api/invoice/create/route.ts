import { NextResponse } from "next/server";
import { z } from "zod";

import { findDemoPayment, shouldUseDemoPayments } from "@/lib/demo-payments";
import { getPortalSession } from "@/lib/portal-auth";
import { createInvoiceForPayment } from "@/lib/invoice-service";
import { verifyPortalPayload, decryptSecret } from "@/lib/crypto";
import { createClient } from "@/lib/supabase/server";
import { fetchPaymentById } from "@/lib/stripe";
import type { StripePayment } from "@/lib/types";

const baseSchema = z.object({
  companyName: z.string().min(2),
  companyAddress: z.string().min(5),
  taxId: z.string().optional().default("")
});

const dashboardSchema = baseSchema.extend({
  source: z.literal("dashboard"),
  paymentId: z.string().min(1)
});

const portalSchema = baseSchema.extend({
  source: z.literal("portal"),
  token: z.string().min(20)
});

export async function POST(request: Request) {
  try {
    const json = await request.json();

    if (json.source === "dashboard") {
      const input = dashboardSchema.parse(json);
      const supabase = await createClient();
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const { data: connection, error } = await supabase
        .from("stripe_connections")
        .select("stripe_secret_key")
        .eq("user_id", user.id)
        .single();

      const demoPayment = shouldUseDemoPayments() ? findDemoPayment(input.paymentId) : null;
      const payment = demoPayment
        ? demoPayment
        : connection && !error
          ? await fetchPaymentById(decryptSecret(connection.stripe_secret_key), input.paymentId)
          : null;

      if (!payment) {
        throw new Error("Stripe connection or payment not found");
      }

      const invoice = await createInvoiceForPayment(user.id, payment, {
        companyName: input.companyName,
        companyAddress: input.companyAddress,
        taxId: input.taxId
      });

      return NextResponse.json({
        invoice
      });
    }

    const input = portalSchema.parse(json);
    const portalSession = await getPortalSession();
    const payload = verifyPortalPayload<{ userId: string; payment: StripePayment }>(input.token);

    if (!portalSession?.email) {
      return NextResponse.json({ error: "Verify your email with magic link first." }, { status: 401 });
    }

    if (portalSession.email.toLowerCase() !== payload.payment.customerEmail.toLowerCase()) {
      return NextResponse.json({ error: "This invoice does not belong to the verified email." }, { status: 403 });
    }

    const invoice = await createInvoiceForPayment(payload.userId, payload.payment, {
      companyName: input.companyName,
      companyAddress: input.companyAddress,
      taxId: input.taxId
    });

    return NextResponse.json({
      invoice
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create invoice" },
      { status: 400 }
    );
  }
}
