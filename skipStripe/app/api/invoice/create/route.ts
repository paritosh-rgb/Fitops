import { NextResponse } from "next/server";
import { z } from "zod";

import { findDemoPayment, shouldUseDemoPayments } from "@/lib/demo-payments";
import { getPortalSession } from "@/lib/portal-auth";
import { createInvoicePdf, generateInvoiceNumber } from "@/lib/invoices";
import { verifyPortalPayload, decryptSecret } from "@/lib/crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";
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

function buildInvoicePayload(payment: StripePayment, input: z.infer<typeof baseSchema>) {
  return {
    invoiceNumber: generateInvoiceNumber(),
    invoiceDate: new Date().toISOString(),
    companyName: input.companyName,
    companyAddress: input.companyAddress,
    taxId: input.taxId,
    customerName: payment.customerName,
    customerEmail: payment.customerEmail,
    amount: payment.amount,
    currency: payment.currency,
    paymentId: payment.id,
    paymentReference: payment.paymentReference,
    itemDescription: `Stripe payment ${payment.id}`
  };
}

async function persistInvoiceRecord(input: {
  userId: string;
  invoiceNumber: string;
  paymentId: string;
  customerEmail: string;
  amount: number;
  currency: string;
  pdfPath: string;
}) {
  const { data: invoice, error } = await supabaseAdmin
    .from("invoices")
    .insert({
      user_id: input.userId,
      invoice_number: input.invoiceNumber,
      payment_id: input.paymentId,
      customer_email: input.customerEmail,
      amount: input.amount / 100,
      currency: input.currency,
      pdf_url: input.pdfPath
    })
    .select("id, invoice_number, pdf_url, currency")
    .single();

  if (!error && invoice) {
    return invoice;
  }

  if (process.env.NODE_ENV === "production") {
    throw error ?? new Error("Failed to save invoice");
  }

  return {
    id: `local-${input.invoiceNumber}`,
    invoice_number: input.invoiceNumber,
    pdf_url: input.pdfPath
  };
}

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

      const invoicePayload = buildInvoicePayload(payment, input);
      const upload = await createInvoicePdf(invoicePayload, user.id);
      const invoice = await persistInvoiceRecord({
        userId: user.id,
        invoiceNumber: invoicePayload.invoiceNumber,
        paymentId: payment.id,
        customerEmail: payment.customerEmail,
        amount: payment.amount,
        currency: payment.currency,
        pdfPath: upload.path
      });

      return NextResponse.json({
        invoice: {
          id: invoice.id,
          invoiceNumber: invoice.invoice_number,
          pdfUrl: upload.signedUrl
        }
      });
    }

    const input = portalSchema.parse(json);
    const portalSession = await getPortalSession();
    const payload = verifyPortalPayload<{ userId: string; payment: StripePayment }>(input.token);

    if (!portalSession?.email) {
      return NextResponse.json({ error: "Verify your email with OTP first." }, { status: 401 });
    }

    if (portalSession.email.toLowerCase() !== payload.payment.customerEmail.toLowerCase()) {
      return NextResponse.json({ error: "This invoice does not belong to the verified email." }, { status: 403 });
    }

    const invoicePayload = buildInvoicePayload(payload.payment, input);
    const upload = await createInvoicePdf(invoicePayload, payload.userId);
    const invoice = await persistInvoiceRecord({
      userId: payload.userId,
      invoiceNumber: invoicePayload.invoiceNumber,
      paymentId: payload.payment.id,
      customerEmail: payload.payment.customerEmail,
      amount: payload.payment.amount,
      currency: payload.payment.currency,
      pdfPath: upload.path
    });

    return NextResponse.json({
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoice_number,
        pdfUrl: upload.signedUrl
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create invoice" },
      { status: 400 }
    );
  }
}
