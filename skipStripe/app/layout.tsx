import type { Metadata } from "next";
import Link from "next/link";

import "@/app/globals.css";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Stripe Invoice Portal",
  description: "Generate professional PDF invoices from Stripe payments instantly."
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return (
    <html lang="en">
      <body>
        <header className="border-b border-white/70 bg-white/80 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <Link href="/" className="text-lg font-semibold tracking-tight">
              Stripe Invoice Portal
            </Link>
            <nav className="flex items-center gap-3">
              <Link href="/portal" className="text-sm text-slate-600 hover:text-slate-950">
                Client Portal
              </Link>
              {user ? (
                <form action="/login/sign-out" method="post">
                  <Button variant="outline" size="sm" type="submit">
                    Sign out
                  </Button>
                </form>
              ) : (
                <Button asChild size="sm">
                  <Link href="/login">Login</Link>
                </Button>
              )}
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
