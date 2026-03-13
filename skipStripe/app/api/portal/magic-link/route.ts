import { NextRequest, NextResponse } from "next/server";

import { attachPortalSession } from "@/lib/portal-auth";
import { publicEnv } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type");

  if (!tokenHash || !type) {
    return NextResponse.redirect(new URL("/portal?error=missing_link_params", publicEnv.NEXT_PUBLIC_APP_URL));
  }

  const { data, error } = await supabaseAdmin.auth.verifyOtp({
    token_hash: tokenHash,
    type: type as "magiclink"
  });

  if (error || !data.user?.email) {
    return NextResponse.redirect(new URL("/portal?error=invalid_or_expired_link", publicEnv.NEXT_PUBLIC_APP_URL));
  }

  const response = NextResponse.redirect(
    new URL(`/portal?verified=1&email=${encodeURIComponent(data.user.email)}`, publicEnv.NEXT_PUBLIC_APP_URL)
  );
  attachPortalSession(response, data.user.email);
  return response;
}
