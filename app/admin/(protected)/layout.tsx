import { redirect } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { AdminSubnav } from "@/components/layout/AdminSubnav";
import { Footer } from "@/components/layout/Footer";
import { signOutAction } from "@/services/auth.actions";
import { getCurrentAdmin } from "@/services/auth";
import { Badge } from "@/components/ui/Badge";

const links = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/account", label: "Account" },
];

export default async function ProtectedAdminLayout({ children }: { children: ReactNode }) {
  const session = await getCurrentAdmin();
  if (!session) redirect("/admin/login");

  return (
    <>
      <Navbar />
      <header className="border-b border-border bg-brand-50/60">
        <div className="container-page flex flex-wrap items-center justify-between gap-3 py-3">
          <div className="flex items-center gap-3">
            <p className="text-sm font-semibold text-brand-900">Admin</p>
            <Badge tone="brand">{session.roleKeys[0] ?? "USER"}</Badge>
            <span className="text-sm text-ink-muted">{session.email}</span>
          </div>
          <div className="flex items-center gap-4">
            <nav aria-label="Admin sections" className="flex gap-1 text-sm">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="inline-flex h-9 items-center rounded-md px-3 font-medium text-ink-muted transition-colors hover:bg-white hover:text-brand-800"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
            <form action={signOutAction}>
              <button
                type="submit"
                className="inline-flex h-9 items-center justify-center rounded-md border border-brand-200 bg-white px-3 text-sm font-semibold text-brand-800 transition-colors hover:bg-brand-50"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <AdminSubnav />
      <main id="main" className="bg-surface-muted/40">{children}</main>
      <Footer />
    </>
  );
}