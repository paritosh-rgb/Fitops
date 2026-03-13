"use client";

import { useState, useTransition } from "react";
import { FileDown, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/browser";
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
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [payments, setPayments] = useState<PortalPayment[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
  const [latestInvoiceUrl, setLatestInvoiceUrl] = useState<string | null>(null);
  const [forms, setForms] = useState<PortalFormState>({});
  const [sendingOtp, startSendingOtp] = useTransition();
  const [verifyingOtp, startVerifyingOtp] = useTransition();
  const [searching, startSearching] = useTransition();
  const [generating, startGenerating] = useTransition();

  const canUseDemoBypass = isDevelopment && demoEmails.includes(email.toLowerCase() as (typeof demoEmails)[number]);

  async function loadVerifiedPayments(activeEmail: string, options?: { demoBypass?: boolean }) {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (options?.demoBypass) {
      headers["x-demo-email"] = activeEmail;
    }

    const response = await fetch("/api/portal/search", {
      method: "POST",
      headers
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

  async function requestOtp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startSendingOtp(async () => {
      setStatus(null);
      setPayments([]);
      setVerifiedEmail(null);
      setLatestInvoiceUrl(null);

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true
        }
      });

      if (error) {
        setStatus(error.message);
        return;
      }

      setOtpSent(true);
      setStatus(`A verification code was sent to ${email}. Enter it below to unlock invoices.`);
    });
  }

  async function verifyOtpAndSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startVerifyingOtp(async () => {
      setStatus(null);
      setLatestInvoiceUrl(null);
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otpCode,
        type: "email"
      });

      if (error) {
        setStatus(error.message);
        return;
      }

      setVerifiedEmail(email);
      setStatus("Email verified. Loading matching payments.");

      startSearching(async () => {
        await loadVerifiedPayments(email);
      });
    });
  }

  async function useDemoBypass() {
    setStatus(null);
    setLatestInvoiceUrl(null);
    setOtpSent(true);
    setVerifiedEmail(email);
    setStatus(`Local demo mode enabled for ${email}. Loading sample payments.`);
    startSearching(async () => {
      await loadVerifiedPayments(email, { demoBypass: true });
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
          <CardTitle>Email verification</CardTitle>
          <CardDescription>
            Verify ownership of your email with a one-time code before invoice lookup is allowed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="flex flex-col gap-4 md:flex-row" onSubmit={requestOtp}>
            <Input
              type="email"
              placeholder="customer@example.com"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <Button disabled={sendingOtp || !email} type="submit">
              {sendingOtp ? "Sending code..." : "Send OTP"}
            </Button>
          </form>

          {otpSent ? (
            <form className="flex flex-col gap-4 md:flex-row" onSubmit={verifyOtpAndSearch}>
              <Input
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Enter 6-digit code"
                required
                value={otpCode}
                onChange={(event) => setOtpCode(event.target.value)}
              />
              <Button disabled={verifyingOtp || searching || otpCode.length < 6} type="submit">
                <Search className="mr-2 h-4 w-4" />
                {verifyingOtp || searching ? "Verifying..." : "Verify and find payments"}
              </Button>
            </form>
          ) : null}

          {canUseDemoBypass ? (
            <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
              Local demo mode detected for {email}. This bypass is available only outside production and
              only for seeded demo emails.
              <div className="mt-3">
                <Button onClick={() => void useDemoBypass()} size="sm" type="button" variant="outline">
                  Use local demo OTP bypass
                </Button>
              </div>
            </div>
          ) : null}

          {verifiedEmail ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              Verified email: {verifiedEmail}
            </div>
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
