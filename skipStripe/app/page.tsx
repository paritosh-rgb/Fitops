import Link from "next/link";
import { ArrowRight, FileText, LockKeyhole, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Wallet,
    title: "Connect Stripe securely",
    description: "Store a restricted Stripe key in encrypted form and fetch payments through server-only APIs."
  },
  {
    icon: FileText,
    title: "Generate polished PDFs",
    description: "Turn payments into branded invoice PDFs with invoice numbers, company details, and payment references."
  },
  {
    icon: LockKeyhole,
    title: "Self-service customer portal",
    description: "Let customers search by email, edit billing data, and download invoices without support overhead."
  }
];

export default function HomePage() {
  return (
    <main>
      <section className="surface-grid border-b border-slate-200/70">
        <div className="mx-auto grid max-w-7xl gap-14 px-6 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="space-y-8">
            <div className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-4 py-1 text-sm font-medium text-sky-800">
              Generate invoices from Stripe payments instantly
            </div>
            <div className="space-y-5">
              <h1 className="max-w-2xl text-5xl font-semibold tracking-tight text-slate-950 lg:text-6xl">
                Stripe Invoice Portal for SaaS teams that need invoices now, not later.
              </h1>
              <p className="max-w-xl text-lg leading-8 text-slate-600">
                Connect Stripe, sync payment history, and publish customer-ready PDF invoices through a
                clean self-service portal backed by Supabase and server-rendered PDF generation.
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Button asChild size="lg">
                <Link href="/login">
                  Start Free <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/portal">Open Client Portal</Link>
              </Button>
            </div>
          </div>

          <Card className="overflow-hidden border-slate-200/80 bg-slate-950 text-white">
            <CardContent className="p-0">
              <div className="border-b border-white/10 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Demo screenshot</p>
                    <h2 className="text-xl font-semibold">Invoice dashboard preview</h2>
                  </div>
                  <div className="rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-medium text-emerald-300">
                    Live data
                  </div>
                </div>
              </div>
              <div className="space-y-4 p-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl bg-white/5 p-4">
                    <p className="text-sm text-slate-400">Payments</p>
                    <p className="mt-2 text-3xl font-semibold">128</p>
                  </div>
                  <div className="rounded-2xl bg-white/5 p-4">
                    <p className="text-sm text-slate-400">Invoices</p>
                    <p className="mt-2 text-3xl font-semibold">94</p>
                  </div>
                  <div className="rounded-2xl bg-white/5 p-4">
                    <p className="text-sm text-slate-400">Portal downloads</p>
                    <p className="mt-2 text-3xl font-semibold">37</p>
                  </div>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white p-5 text-slate-950">
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <p className="text-sm text-slate-500">Payment</p>
                      <p className="font-semibold">ch_3QXa...Yh8</p>
                    </div>
                    <div className="rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-700">
                      Ready to invoice
                    </div>
                  </div>
                  <div className="grid gap-3 text-sm text-slate-600 md:grid-cols-2">
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-slate-500">Customer</p>
                      <p className="mt-1 font-medium text-slate-900">Alex Johnson</p>
                      <p>alex@acme.io</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-slate-500">Amount</p>
                      <p className="mt-1 font-medium text-slate-900">$249.00 USD</p>
                      <p>Mar 13, 2026</p>
                    </div>
                  </div>
                  <div className="mt-4 rounded-2xl bg-slate-950 px-4 py-3 text-sm text-white">
                    Invoice #SIP-20260313-0102 generated and stored in Supabase Storage
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title} className="border-white/60 bg-white/90">
              <CardContent className="space-y-4 p-6">
                <feature.icon className="h-10 w-10 rounded-2xl bg-sky-100 p-2.5 text-sky-700" />
                <div>
                  <h3 className="text-xl font-semibold text-slate-950">{feature.title}</h3>
                  <p className="mt-2 text-slate-600">{feature.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20">
        <Card className="border-slate-200/80 bg-white/90">
          <CardContent className="grid gap-8 p-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.25em] text-sky-700">Pricing</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Simple MVP pricing</h2>
              <p className="mt-3 max-w-2xl text-slate-600">
                Start with one Stripe account, unlimited invoice generation, and a hosted portal on Vercel.
              </p>
            </div>
            <div className="rounded-3xl bg-slate-950 px-8 py-6 text-white">
              <p className="text-sm text-slate-400">Growth Plan</p>
              <div className="mt-3 flex items-end gap-2">
                <span className="text-5xl font-semibold">$29</span>
                <span className="pb-1 text-slate-400">/month</span>
              </div>
              <p className="mt-3 max-w-xs text-sm text-slate-300">
                Includes dashboard, invoice PDFs, secure Stripe sync, and self-service downloads.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
