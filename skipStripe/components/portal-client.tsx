"use client";

import { useEffect, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { FileDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatDate, formatMoney } from "@/lib/utils";
import type { PortalPayment } from "@/lib/types";

type PortalFormState = Record<
  string,
  {
    companyName: string;
    companyAddress: string;
    taxId: string;
  }
>;

const demoEmails = ["alex@example.com", "priya@example.com"] as const;
const isDevelopment = process.env.NODE_ENV !== "production";

export function PortalClient() {
  const searchParams = useSearchParams();
  const callbackEmail = searchParams.get("email") ?? "";
  const magicLinkVerified = searchParams.get("verified") === "1";
  const magicLinkError = searchParams.get("error");

  const [email, setEmail] = useState(callbackEmail);
  const [payments, setPayments] = useState<PortalPayment[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(
    magicLinkVerified && callbackEmail ? callbackEmail : null
  );
  const [latestInvoiceUrl, setLatestInvoiceUrl] = useState<string | null>(null);
  const [debugLink, setDebugLink] = useState<string | null>(null);
  const [forms, setForms] = useState<PortalFormState>({});
  const [sendingLink, startSendingLink] = useTransition();
  const [, startSearching] = useTransition();
  const [generating, startGenerating] = useTransition();

  const isDemoEmail = isDevelopment && demoEmails.includes(email.toLowerCase() as (typeof demoEmails)[number]);

  async function loadVerifiedPayments(activeEmail: string) {
    const response = await fetch("/api/portal/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });
    const data = await response.json();

    if (!response.ok) {
      setStatus(data.error ?? "Unable to search payments.");
      return;
    }

    setPayments(data.payments);
    const nextForms: PortalFormState = {};
    data.payments.forEach((payment: PortalPayment) => {
      nextForms[payment.id] = {
        companyName: payment.customerName ? `${payment.customerName} LLC` : "Your Company",
        companyAddress: "",
        taxId: ""
      };
    });
    setForms(nextForms);
    setStatus(
      data.payments.length
        ? `Found ${data.payments.length} payment${data.payments.length === 1 ? "" : "s"} for ${activeEmail}.`
        : `No payments found for ${activeEmail}.`
    );
  }

  useEffect(() => {
    if (magicLinkVerified && callbackEmail && payments.length === 0) {
      startSearching(async () => {
        await loadVerifiedPayments(callbackEmail);
      });
    }
  }, [callbackEmail, magicLinkVerified, payments.length]);

  async function requestMagicLink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startSendingLink(async () => {
      setStatus(null);
      setPayments([]);
      setVerifiedEmail(null);
      setLatestInvoiceUrl(null);
      setDebugLink(null);

      const response = await fetch("/api/portal/request-magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await response.json();

      if (!response.ok) {
        setStatus(data.error ?? "Failed to send OTP.");
        return;
      }

      setDebugLink(data.debugLink ?? null);
      setStatus(`A magic link was sent to ${email}. Open it to unlock invoices.`);
    });
  }

  function updateField(paymentId: string, field: keyof PortalFormState[string], value: string) {
    setForms((current) => ({
      ...current,
      [paymentId]: {
        ...current[paymentId],
        [field]: value
      }
    }));
  }

  async function generateInvoice(payment: PortalPayment) {
    const form = forms[payment.id];
    startGenerating(async () => {
      setStatus(null);
      setLatestInvoiceUrl(null);
      const response = await fetch("/api/invoice/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "portal",
          token: payment.token,
          companyName: form?.companyName ?? "Your Company",
          companyAddress: form?.companyAddress ?? "",
          taxId: form?.taxId ?? ""
        })
      });
      const data = await response.json();

      if (!response.ok) {
        setStatus(data.error ?? "Unable to generate invoice.");
        return;
      }

      setLatestInvoiceUrl(data.invoice.pdfUrl);
      setStatus(`Invoice ${data.invoice.invoiceNumber} is ready.`);
    });
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Email magic link</CardTitle>
          <CardDescription>
            Verify ownership of your email with a Supabase magic link before invoice lookup is allowed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="flex flex-col gap-4 md:flex-row" onSubmit={requestMagicLink}>
            <Input
              type="email"
              placeholder="customer@example.com"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <Button disabled={sendingLink || !email} type="submit">
              {sendingLink ? "Sending link..." : "Send magic link"}
            </Button>
          </form>

          {isDemoEmail && debugLink ? (
            <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
              Local demo mode detected. Open the generated magic link directly:
              <div className="mt-3">
                <a className="font-semibold underline" href={debugLink}>
                  Open demo magic link
                </a>
              </div>
            </div>
          ) : null}

          {verifiedEmail ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              Verified email: {verifiedEmail}
            </div>
          ) : null}

          {magicLinkError ? (
            <p className="mt-4 text-sm text-red-600">The magic link is invalid or expired. Request a new one.</p>
          ) : null}
          {status ? <p className="mt-4 text-sm text-slate-700">{status}</p> : null}
          {latestInvoiceUrl ? (
            <Button asChild size="sm" variant="outline">
              <a href={latestInvoiceUrl} rel="noreferrer" target="_blank">
                Open latest invoice
              </a>
            </Button>
          ) : null}
        </CardContent>
      </Card>

      <div className="space-y-6">
        {payments.map((payment) => (
          <Card key={payment.id}>
            <CardHeader>
              <CardTitle className="text-2xl">{payment.customerName}</CardTitle>
              <CardDescription>
                {payment.customerEmail} · {formatMoney(payment.amount, payment.currency)} · {formatDate(payment.date)}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="grid gap-3 text-sm text-slate-600">
                  <div>
                    <p className="text-slate-500">Payment ID</p>
                    <p className="font-medium text-slate-950">{payment.id}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Reference</p>
                    <p className="font-medium text-slate-950">{payment.paymentReference}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor={`companyName-${payment.id}`}>Company name</Label>
                  <Input
                    id={`companyName-${payment.id}`}
                    value={forms[payment.id]?.companyName ?? ""}
                    onChange={(event) => updateField(payment.id, "companyName", event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`companyAddress-${payment.id}`}>Billing address</Label>
                  <Textarea
                    id={`companyAddress-${payment.id}`}
                    value={forms[payment.id]?.companyAddress ?? ""}
                    onChange={(event) => updateField(payment.id, "companyAddress", event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`taxId-${payment.id}`}>Tax ID</Label>
                  <Input
                    id={`taxId-${payment.id}`}
                    value={forms[payment.id]?.taxId ?? ""}
                    onChange={(event) => updateField(payment.id, "taxId", event.target.value)}
                    placeholder="Optional"
                  />
                </div>
                <Button disabled={generating} onClick={() => void generateInvoice(payment)}>
                  <FileDown className="mr-2 h-4 w-4" />
                  Download invoice
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
