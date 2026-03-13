import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { serverEnv } from "@/lib/env";

const schema = z.object({
  invoiceId: z.string().uuid().or(z.string().min(1))
});

export async function GET(request: NextRequest) {
  try {
    const parsed = schema.parse({
      invoiceId: request.nextUrl.searchParams.get("invoiceId")
    });

    const { data: invoice, error } = await supabaseAdmin
      .from("invoices")
      .select("pdf_url")
      .eq("id", parsed.invoiceId)
      .single();

    if (error || !invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
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
