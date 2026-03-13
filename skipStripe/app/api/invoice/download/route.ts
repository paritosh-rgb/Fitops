import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getPortalSession } from "@/lib/portal-auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { serverEnv } from "@/lib/env";
import { absoluteUrl } from "@/lib/utils";

const schema = z.object({
  invoiceId: z.string().uuid().or(z.string().min(1))
});

export async function GET(request: NextRequest) {
  try {
    const parsed = schema.parse({
      invoiceId: request.nextUrl.searchParams.get("invoiceId")
    });
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    const portalSession = await getPortalSession();

    const { data: invoice, error } = await supabaseAdmin
      .from("invoices")
      .select("user_id, customer_email, pdf_url")
      .eq("id", parsed.invoiceId)
      .single();

    if (error || !invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const canAccess =
      (user && invoice.user_id === user.id) ||
      (portalSession?.email &&
        invoice.customer_email.toLowerCase() === portalSession.email.toLowerCase());

    if (!canAccess) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (process.env.NODE_ENV !== "production" && invoice.pdf_url.startsWith("generated/")) {
      return NextResponse.redirect(absoluteUrl(`/${invoice.pdf_url}`));
    }

    const { data } = await supabaseAdmin.storage
      .from(serverEnv.SUPABASE_STORAGE_BUCKET)
      .createSignedUrl(invoice.pdf_url, 60 * 10);

    if (!data?.signedUrl) {
      throw new Error("Failed to create download URL");
    }

    return NextResponse.redirect(data.signedUrl);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to download invoice" },
      { status: 400 }
    );
  }
}
