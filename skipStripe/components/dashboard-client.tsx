"use client";

import { useEffect, useState, useTransition } from "react";
import { Download, RefreshCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { formatDate, formatMoney } from "@/lib/utils";
import type { StripePayment } from "@/lib/types";

type Props = {
  hasConnection: boolean;
  webhookToken: string | null;
  stripeAccountId: string | null;
  recentInvoices: Array<{
    id: string;
    invoice_number: string;
    payment_id: string;
    customer_email: string;
    amount: number;
    currency: string;
    pdf_url: string;
    created_at: string;
  }>;
  userEmail: string;
};

function formatStoredAmount(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase()
  }).format(amount);
}

const defaultCompany = {
  companyName: "Acme Inc.",
  companyAddress: "123 Market Street\nSan Francisco, CA 94105\nUnited States"
};

export function DashboardClient({
  hasConnection,
  webhookToken,
  stripeAccountId,
  recentInvoices,
  userEmail
}: Props) {
  const [stripeKey, setStripeKey] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [origin] = useState(() => (typeof window !== "undefined" ? window.location.origin : ""));
  const [companyName, setCompanyName] = useState(defaultCompany.companyName);
  const [companyAddress, setCompanyAddress] = useState(defaultCompany.companyAddress);
  const [taxId, setTaxId] = useState("");
  const [payments, setPayments] = useState<StripePayment[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [latestInvoiceUrl, setLatestInvoiceUrl] = useState<string | null>(null);
  const [loadingPayments, startLoadingPayments] = useTransition();
  const [savingKey, startSavingKey] = useTransition();
  const [savingWebhook, startSavingWebhook] = useTransition();
  const [creatingInvoice, startCreatingInvoice] = useTransition();

  const webhookEndpoint = webhookToken && origin ? `${origin}/api/stripe/webhook/${webhookToken}` : null;

  async function loadPayments() {
    startLoadingPayments(async () => {
      setStatus(null);
      const response = await fetch("/api/stripe/payments");
      const data = await response.json();

      if (!response.ok) {
        setStatus(data.error ?? "Failed to load payments.");
        return;
      }

      setPayments(data.payments);
    });
  }

  async function handleConnectStripe(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startSavingKey(async () => {
      setStatus(null);
      const response = await fetch("/api/connect-stripe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stripeSecretKey: stripeKey })
      });
      const data = await response.json();
      setStatus(response.ok ? "Stripe key saved securely." : data.error ?? "Failed to save Stripe key.");
      if (response.ok) {
        setStripeKey("");
        void loadPayments();
      }
    });
  }

  async function handleSaveWebhookSecret(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startSavingWebhook(async () => {
      setStatus(null);
      const response = await fetch("/api/connect-stripe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stripeWebhookSecret: webhookSecret })
      });
      const data = await response.json();
      if (!response.ok) {
        setStatus(data.error ?? "Failed to save webhook secret.");
        return;
      }

      setWebhookSecret("");
      setStatus("Webhook secret saved successfully.");
    });
  }

  useEffect(() => {
    void loadPayments();
  }, [hasConnection]);

  async function generateInvoice(payment: StripePayment) {
    startCreatingInvoice(async () => {
      setStatus(null);
      setLatestInvoiceUrl(null);
      const response = await fetch("/api/invoice/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "dashboard",
          paymentId: payment.id,
          companyName,
          companyAddress,
          taxId
        })
      });
      const data = await response.json();
      if (!response.ok) {
        setStatus(data.error ?? "Failed to generate invoice.");
        return;
      }

      setStatus(`Invoice ${data.invoice.invoiceNumber} created successfully.`);
      setLatestInvoiceUrl(data.invoice.pdfUrl);
    });
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <CardTitle>Connect Stripe</CardTitle>
            <CardDescription>
              Paste your restricted read-only Stripe secret key. It is encrypted before being stored.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleConnectStripe}>
              <div className="space-y-2">
                <Label htmlFor="stripeSecretKey">Restricted secret key</Label>
                <Input
                  id="stripeSecretKey"
                  type="password"
                  placeholder={hasConnection ? "Update Stripe key (optional)" : "rk_live_..."}
                  value={stripeKey}
                  onChange={(event) => setStripeKey(event.target.value)}
                  required={!hasConnection}
                />
              </div>
              <Button disabled={savingKey}>{savingKey ? "Saving..." : hasConnection ? "Update Stripe key" : "Save Stripe connection"}</Button>
            </form>

            {hasConnection ? (
              <form className="mt-6 space-y-4 border-t pt-6" onSubmit={handleSaveWebhookSecret}>
                <div className="space-y-2">
                  <Label htmlFor="webhookSecret">Webhook signing secret</Label>
                  <Input
                    id="webhookSecret"
                    type="password"
                    placeholder="whsec_..."
                    value={webhookSecret}
                    onChange={(event) => setWebhookSecret(event.target.value)}
                    required
                  />
                </div>
                <Button disabled={savingWebhook} variant="outline">
                  {savingWebhook ? "Saving..." : "Save webhook secret"}
                </Button>
              </form>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stripe webhook</CardTitle>
            <CardDescription>
              Configure this endpoint in Stripe and subscribe to <code>charge.succeeded</code> for auto-invoicing.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {webhookEndpoint ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
                <p className="font-medium text-slate-900">Webhook endpoint URL</p>
                <p className="mt-1 break-all text-slate-700">{webhookEndpoint}</p>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Save your Stripe key first to generate endpoint details.</p>
            )}
            {stripeAccountId ? (
              <p className="text-xs text-slate-500">Connected Stripe account: {stripeAccountId}</p>
            ) : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Invoice defaults</CardTitle>
            <CardDescription>These fields are used when generating a PDF from a Stripe payment.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company name</Label>
              <Input id="companyName" value={companyName} onChange={(event) => setCompanyName(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxId">Tax ID</Label>
              <Input id="taxId" value={taxId} onChange={(event) => setTaxId(event.target.value)} placeholder="Optional" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="companyAddress">Company address</Label>
              <Textarea
                id="companyAddress"
                value={companyAddress}
                onChange={(event) => setCompanyAddress(event.target.value)}
              />
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 md:col-span-2">
              Logged in as <span className="font-medium text-slate-900">{userEmail}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {status ? <p className="text-sm text-slate-700">{status}</p> : null}
      {latestInvoiceUrl ? (
        <div className="flex items-center gap-3 text-sm">
          <span className="text-slate-700">Invoice ready.</span>
          <Button asChild size="sm" variant="outline">
            <a href={latestInvoiceUrl} rel="noreferrer" target="_blank">
              Open latest invoice
            </a>
          </Button>
        </div>
      ) : null}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Stripe payments</CardTitle>
            <CardDescription>
              Review customer payments and generate invoice PDFs on demand. In local development, demo
              payments appear automatically if Stripe returns none.
            </CardDescription>
          </div>
          <Button disabled={loadingPayments} onClick={() => void loadPayments()} variant="outline">
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payment ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.length ? (
                  payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">{payment.id}</TableCell>
                      <TableCell>{payment.customerName}</TableCell>
                      <TableCell>{payment.customerEmail}</TableCell>
                      <TableCell>{formatMoney(payment.amount, payment.currency)}</TableCell>
                      <TableCell>{formatDate(payment.date)}</TableCell>
                      <TableCell className="text-right">
                        <Button disabled={creatingInvoice} onClick={() => void generateInvoice(payment)} size="sm">
                          Generate Invoice
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell className="text-slate-500" colSpan={6}>
                      {hasConnection
                        ? "No payments found yet."
                        : "No live Stripe payments found. Demo payments should appear automatically in local development."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent invoices</CardTitle>
          <CardDescription>Latest invoices generated and stored in Supabase Storage.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentInvoices.length ? (
            recentInvoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="font-medium text-slate-950">{invoice.invoice_number}</p>
                  <p className="text-sm text-slate-600">
                    {invoice.customer_email} · {formatStoredAmount(invoice.amount, invoice.currency)} · {formatDate(invoice.created_at)}
                  </p>
                </div>
                <Button asChild variant="outline">
                  <a href={`/api/invoice/download?invoiceId=${invoice.id}`} rel="noreferrer" target="_blank">
                    <Download className="mr-2 h-4 w-4" />
                    Open PDF
                  </a>
                </Button>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">No invoices generated yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
