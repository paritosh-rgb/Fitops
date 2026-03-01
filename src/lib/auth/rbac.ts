export type UserRole = "owner" | "front_desk" | "trainer";

const DASHBOARD_RULES: Array<{ prefix: string; roles: UserRole[] }> = [
  { prefix: "/dashboard", roles: ["owner", "front_desk", "trainer"] },
  { prefix: "/dashboard/members", roles: ["owner", "front_desk"] },
  { prefix: "/dashboard/check-in", roles: ["owner", "front_desk"] },
  { prefix: "/dashboard/renewals", roles: ["owner", "front_desk"] },
  { prefix: "/dashboard/trainers", roles: ["owner", "trainer"] },
  { prefix: "/dashboard/growth", roles: ["owner"] },
  { prefix: "/dashboard/owner", roles: ["owner"] },
];

function hasPrefixAccess(pathname: string, role: UserRole, rules: Array<{ prefix: string; roles: UserRole[] }>) {
  let matched: { prefix: string; roles: UserRole[] } | null = null;
  for (const rule of rules) {
    if (pathname === rule.prefix || pathname.startsWith(`${rule.prefix}/`)) {
      if (!matched || rule.prefix.length > matched.prefix.length) {
        matched = rule;
      }
    }
  }

  if (!matched) return true;
  return matched.roles.includes(role);
}

export function canAccessDashboardPath(pathname: string, role: UserRole): boolean {
  return hasPrefixAccess(pathname, role, DASHBOARD_RULES);
}

const API_PREFIX_RULES: Array<{ prefix: string; roles: UserRole[] }> = [
  { prefix: "/api/auth/logout", roles: ["owner", "front_desk", "trainer"] },
  { prefix: "/api/dashboard", roles: ["owner", "front_desk", "trainer"] },
  { prefix: "/api/members", roles: ["owner", "front_desk"] },
  { prefix: "/api/reminders/dues", roles: ["owner", "front_desk"] },
  { prefix: "/api/expenses", roles: ["owner"] },
  { prefix: "/api/leads", roles: ["owner"] },
  { prefix: "/api/referrals", roles: ["owner"] },
  { prefix: "/api/broadcasts/festival", roles: ["owner"] },
];

export function canAccessApiPath(pathname: string, role: UserRole): boolean {
  return hasPrefixAccess(pathname, role, API_PREFIX_RULES);
}
