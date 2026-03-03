import { NextRequest, NextResponse } from "next/server";
import { canAccessApiPath, canAccessDashboardPath } from "@/lib/auth/rbac";
import { parseSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";

function isProtectedPath(pathname: string): boolean {
  return pathname.startsWith("/dashboard") || pathname.startsWith("/api/");
}

function isPublicApi(pathname: string): boolean {
  return (
    pathname === "/api/auth/login" ||
    pathname === "/api/auth/signup" ||
    pathname === "/api/public/check-in" ||
    pathname === "/api/public/member-status" ||
    pathname === "/api/public/diet-plan-pdf" ||
    pathname === "/api/public/tv-leaderboard" ||
    pathname === "/api/public/member-auth/login" ||
    pathname === "/api/public/member-auth/signup" ||
    pathname === "/api/public/member-auth/logout"
  );
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = parseSessionToken(token);
  const authenticated = Boolean(session);

  if ((pathname === "/login" || pathname === "/signup") && authenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (isProtectedPath(pathname) && !isPublicApi(pathname) && !authenticated) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const nextPath = `${pathname}${search}`;
    const loginUrl = new URL(`/login?next=${encodeURIComponent(nextPath)}`, request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (authenticated && session) {
    if (pathname.startsWith("/dashboard") && !canAccessDashboardPath(pathname, session.role)) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    if (
      pathname.startsWith("/api/") &&
      !isPublicApi(pathname) &&
      !canAccessApiPath(pathname, session.role)
    ) {
      return NextResponse.json({ error: "Forbidden for your role" }, { status: 403 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*", "/login", "/signup"],
};
