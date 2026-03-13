import crypto from "crypto";
import fs from "fs/promises";
import nodePath from "path";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { serverEnv } from "@/lib/env";
import { htmlToPdfBuffer } from "@/lib/pdf";
import { renderInvoiceHtml } from "@/templates/invoice";
import type { InvoicePayload } from "@/lib/types";
import { absoluteUrl } from "@/lib/utils";

export function generateInvoiceNumber() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase();
  return `SIP-${date}-${suffix}`;
}

export async function uploadInvoicePdf(userId: string, invoiceNumber: string, buffer: Buffer) {
  const storagePath = `${userId}/${invoiceNumber}.pdf`;
  try {
    const { error } = await supabaseAdmin.storage
      .from(serverEnv.SUPABASE_STORAGE_BUCKET)
      .upload(storagePath, buffer, {
        contentType: "application/pdf",
        upsert: true
      });

    if (error) {
      throw error;
    }

    const { data } = await supabaseAdmin.storage
      .from(serverEnv.SUPABASE_STORAGE_BUCKET)
      .createSignedUrl(storagePath, 60 * 60 * 24 * 7);

    if (!data?.signedUrl) {
      throw new Error("Failed to create signed URL for invoice");
    }

    return {
      path: storagePath,
      signedUrl: data.signedUrl,
      persistedRemotely: true
    };
  } catch (error) {
    if (process.env.NODE_ENV === "production") {
      throw error;
    }

    const localDir = nodePath.join(process.cwd(), "public", "generated");
    await fs.mkdir(localDir, { recursive: true });
    const filePath = nodePath.join(localDir, `${invoiceNumber}.pdf`);
    await fs.writeFile(filePath, buffer);

    return {
      path: `generated/${invoiceNumber}.pdf`,
      signedUrl: absoluteUrl(`/generated/${invoiceNumber}.pdf`),
      persistedRemotely: false
    };
  }
}

export async function createInvoicePdf(payload: InvoicePayload, userId: string) {
  const html = renderInvoiceHtml(payload);
  const buffer = await htmlToPdfBuffer(html);
  return uploadInvoicePdf(userId, payload.invoiceNumber, buffer);
}
