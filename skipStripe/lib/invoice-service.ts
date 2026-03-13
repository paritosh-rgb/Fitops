import { createInvoicePdf, generateInvoiceNumber } from "@/lib/invoices";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { StripePayment } from "@/lib/types";

type InvoiceCompanyDetails = {
  companyName: string;
  companyAddress: string;
  taxId?: string;
};

function normalizeCurrency(currency: string) {
  return currency.toLowerCase();
}

export function buildInvoicePayload(payment: StripePayment, details: InvoiceCompanyDetails) {
  return {
    invoiceNumber: generateInvoiceNumber(),
    invoiceDate: new Date().toISOString(),
    companyName: details.companyName,
    companyAddress: details.companyAddress,
    taxId: details.taxId ?? "",
    customerName: payment.customerName,
    customerEmail: payment.customerEmail,
    amount: payment.amount,
    currency: normalizeCurrency(payment.currency),
    paymentId: payment.id,
    paymentReference: payment.paymentReference,
    itemDescription: `Stripe payment ${payment.id}`
  };
}

type PersistInput = {
  userId: string;
  invoiceNumber: string;
  paymentId: string;
  customerEmail: string;
  amount: number;
  currency: string;
  pdfPath: string;
};

async function persistInvoiceRecord(input: PersistInput) {
  const { data: existing, error: existingError } = await supabaseAdmin
    .from("invoices")
    .select("id, invoice_number, pdf_url, currency")
    .eq("user_id", input.userId)
    .eq("payment_id", input.paymentId)
    .maybeSingle();

  if (!existingError && existing) {
    return existing;
  }

  const { data: invoice, error } = await supabaseAdmin
    .from("invoices")
    .insert({
      user_id: input.userId,
      invoice_number: input.invoiceNumber,
      payment_id: input.paymentId,
      customer_email: input.customerEmail,
      amount: input.amount / 100,
      currency: normalizeCurrency(input.currency),
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
    pdf_url: input.pdfPath,
    currency: normalizeCurrency(input.currency)
  };
}

export async function createInvoiceForPayment(
  userId: string,
  payment: StripePayment,
  details: InvoiceCompanyDetails
) {
  const payload = buildInvoicePayload(payment, details);
  const upload = await createInvoicePdf(payload, userId);
  const invoice = await persistInvoiceRecord({
    userId,
    invoiceNumber: payload.invoiceNumber,
    paymentId: payment.id,
    customerEmail: payment.customerEmail,
    amount: payment.amount,
    currency: payment.currency,
    pdfPath: upload.path
  });

  return {
    id: invoice.id,
    invoiceNumber: invoice.invoice_number,
    pdfUrl: upload.signedUrl
  };
}
