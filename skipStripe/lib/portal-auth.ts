import crypto from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { serverEnv } from "@/lib/env";

const PORTAL_COOKIE_NAME = "portal_session";
const PORTAL_SESSION_TTL_SECONDS = 60 * 60;

type PortalSessionPayload = {
  email: string;
  exp: number;
};

function signPortalSession(payload: PortalSessionPayload) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", serverEnv.PORTAL_SIGNING_SECRET)
    .update(encoded)
    .digest("base64url");

  return `${encoded}.${signature}`;
}

function verifyPortalSession(token: string): PortalSessionPayload | null {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) {
    return null;
  }

  const expected = crypto
    .createHmac("sha256", serverEnv.PORTAL_SIGNING_SECRET)
    .update(encoded)
    .digest("base64url");

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return null;
  }

  const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as PortalSessionPayload;
  if (payload.exp < Date.now()) {
    return null;
  }

  return payload;
}

export function attachPortalSession(response: NextResponse, email: string) {
  const token = signPortalSession({
    email: email.toLowerCase(),
    exp: Date.now() + PORTAL_SESSION_TTL_SECONDS * 1000
  });

  response.cookies.set(PORTAL_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: PORTAL_SESSION_TTL_SECONDS
  });
}

export function clearPortalSession(response: NextResponse) {
  response.cookies.set(PORTAL_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
}

export async function getPortalSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(PORTAL_COOKIE_NAME)?.value;
  return token ? verifyPortalSession(token) : null;
}
