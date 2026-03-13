import { NextResponse } from "next/server";

import { demoPayments, shouldUseDemoPayments } from "@/lib/demo-payments";
import { getAuthenticatedUser } from "@/lib/auth";
import { decryptSecret } from "@/lib/crypto";
import { fetchPayments } from "@/lib/stripe";

export async function GET() {
  try {
    const { user, supabase } = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { data: connection, error } = await supabase
      .from("stripe_connections")
      .select("stripe_secret_key")
      .eq("user_id", user.id)
      .single();

    if (error || !connection) {
      return NextResponse.json({ payments: shouldUseDemoPayments() ? demoPayments : [] });
    }

    const payments = await fetchPayments(decryptSecret(connection.stripe_secret_key));
    return NextResponse.json({
      payments: payments.length || !shouldUseDemoPayments() ? payments : demoPayments
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch payments" },
      { status: 400 }
    );
  }
}
