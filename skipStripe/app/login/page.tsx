import { redirect } from "next/navigation";

import { AuthCard } from "@/components/auth-card";
import { createClient } from "@/lib/supabase/server";

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-73px)] max-w-7xl items-center px-6 py-16">
      <div className="grid w-full gap-12 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-700">Secure Access</p>
          <h1 className="max-w-xl text-5xl font-semibold tracking-tight text-slate-950">
            Sign in to manage Stripe payments and turn them into polished invoices.
          </h1>
          <p className="max-w-lg text-lg text-slate-600">
            Email/password auth is handled by Supabase. Stripe keys stay encrypted on the backend and
            every invoice is generated as a PDF through server-side rendering.
          </p>
        </div>
        <AuthCard />
      </div>
    </main>
  );
}
