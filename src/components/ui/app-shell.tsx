"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useState } from "react";
import { useToast } from "@/components/ui/toast-provider";
import type { UserRole } from "@/lib/auth/rbac";

interface AppShellProps {
  gymName: string;
  role: UserRole;
  title: string;
  subtitle: string;
  children: ReactNode;
}

const links: Array<{ href: string; label: string; roles: UserRole[] }> = [
  { href: "/dashboard", label: "Overview", roles: ["owner", "front_desk", "trainer"] },
  { href: "/dashboard/members", label: "Members", roles: ["owner", "front_desk"] },
  { href: "/dashboard/check-in", label: "QR Check-In", roles: ["owner", "front_desk"] },
  { href: "/dashboard/renewals", label: "Renewals", roles: ["owner", "front_desk"] },
  { href: "/dashboard/trainers", label: "Trainers", roles: ["owner", "trainer"] },
  { href: "/dashboard/growth", label: "Growth", roles: ["owner"] },
  { href: "/dashboard/owner", label: "Owner Ledger", roles: ["owner"] },
];

function roleLabel(role: UserRole): string {
  if (role === "front_desk") return "Front Desk";
  if (role === "trainer") return "Trainer";
  return "Owner";
}

export default function AppShell({ gymName, role, title, subtitle, children }: AppShellProps) {
  const pathname = usePathname();
  const { showToast } = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  function closeMenu() {
    setMenuOpen(false);
  }

  async function logout() {
    try {
      setLoggingOut(true);
      await fetch("/api/auth/logout", { method: "POST" });
      showToast("Logged out", "info");
      window.location.href = "/login";
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div className="layout-root">
      <div className={`mobile-backdrop ${menuOpen ? "show" : ""}`} onClick={closeMenu} />

      <header className="mobile-topbar">
        <button
          type="button"
          aria-label="Open navigation"
          className="hamburger"
          onClick={() => setMenuOpen((x) => !x)}
        >
          <span />
          <span />
          <span />
        </button>
        <Link href="/" className="brand-link" onClick={closeMenu}>
          {gymName}
        </Link>
      </header>

      <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
        <div className="brand-block">
          <p className="eyebrow">FitOps</p>
          <h2>
            <Link href="/" className="brand-link" onClick={closeMenu}>
              {gymName}
            </Link>
          </h2>
          <p className="role-chip">{roleLabel(role)}</p>
        </div>

        <nav>
          {links
            .filter((link) => link.roles.includes(role))
            .map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`nav-link ${active ? "active" : ""}`}
                  onClick={closeMenu}
                >
                  {link.label}
                </Link>
              );
            })}
          <button
            type="button"
            className="nav-link nav-logout"
            onClick={logout}
            disabled={loggingOut}
          >
            {loggingOut ? "Logging out..." : "Logout"}
          </button>
        </nav>
      </aside>

      <main className="content-area">
        <section className="hero-module">
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </section>
        {children}
      </main>
    </div>
  );
}
