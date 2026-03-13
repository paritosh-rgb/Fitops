import type { StripePayment } from "@/lib/types";

export const demoPayments: StripePayment[] = [
  {
    id: "demo_payment_001",
    customerName: "Alex Johnson",
    customerEmail: "alex@example.com",
    amount: 24900,
    currency: "usd",
    date: "2026-03-13T09:30:00.000Z",
    paymentReference: "pi_demo_001"
  },
  {
    id: "demo_payment_002",
    customerName: "Priya Sharma",
    customerEmail: "priya@example.com",
    amount: 9900,
    currency: "usd",
    date: "2026-03-11T13:10:00.000Z",
    paymentReference: "pi_demo_002"
  }
];

export function findDemoPayment(paymentId: string) {
  return demoPayments.find((payment) => payment.id === paymentId) ?? null;
}

export function shouldUseDemoPayments() {
  return process.env.NODE_ENV !== "production";
}
