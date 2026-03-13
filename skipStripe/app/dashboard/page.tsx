import { requireUser } from "@/lib/auth";
import { DashboardClient } from "@/components/dashboard-client";

export default async function DashboardPage() {
  const { supabase, user } = await requireUser();
  const { data: connection } = await supabase
    .from("stripe_connections")
    .select("id, created_at")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: invoices } = await supabase
    .from("invoices")
    .select("id, invoice_number, payment_id, customer_email, amount, pdf_url, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-10 space-y-3">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-700">Dashboard</p>
        <h1 className="text-4xl font-semibold tracking-tight text-slate-950">Payments and invoice generation</h1>
        <p className="max-w-3xl text-slate-600">
          Connect a restricted Stripe key, review payment history, and generate invoice PDFs stored in
          Supabase Storage.
        </p>
      </div>
      <DashboardClient
        hasConnection={Boolean(connection)}
        recentInvoices={invoices ?? []}
        userEmail={user.email ?? ""}
      />
    </main>
  );
}
