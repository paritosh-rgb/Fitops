import Stripe from "stripe";

import type { StripePayment } from "@/lib/types";

export function createStripeClient(secretKey: string) {
  return new Stripe(secretKey, {
    apiVersion: "2025-02-24.acacia"
  });
}

function mapChargeToPayment(charge: Stripe.Charge): StripePayment | null {
  const customerEmail = charge.billing_details.email ?? "";
  if (!customerEmail) {
    return null;
  }

  return {
    id: charge.id,
    customerName: charge.billing_details.name ?? "Stripe Customer",
    customerEmail,
    amount: charge.amount,
    currency: charge.currency,
    date: new Date(charge.created * 1000).toISOString(),
    paymentReference: charge.payment_intent?.toString() ?? charge.balance_transaction?.toString() ?? charge.id
  };
}

export async function fetchPayments(secretKey: string, email?: string) {
  const stripe = createStripeClient(secretKey);
  const charges = await stripe.charges.list({ limit: 100 });

  return charges.data
    .map(mapChargeToPayment)
    .filter((payment): payment is StripePayment => Boolean(payment))
    .filter((payment) => (email ? payment.customerEmail.toLowerCase() === email.toLowerCase() : true))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function fetchPaymentById(secretKey: string, paymentId: string) {
  const stripe = createStripeClient(secretKey);
  const charge = await stripe.charges.retrieve(paymentId);
  const payment = mapChargeToPayment(charge);

  if (!payment) {
    throw new Error("Stripe charge is missing billing email");
  }

  return payment;
}
