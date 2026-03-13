import { PortalClient } from "@/components/portal-client";

export default function PortalPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-14">
      <div className="mb-10 space-y-3">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-700">Client Portal</p>
        <h1 className="text-4xl font-semibold tracking-tight text-slate-950">Find and download your invoices</h1>
        <p className="max-w-2xl text-slate-600">
          Verify the checkout email with a one-time code, then review matching payments, add billing
          details, and generate invoice PDFs without contacting support.
        </p>
      </div>
      <PortalClient />
    </main>
  );
}
