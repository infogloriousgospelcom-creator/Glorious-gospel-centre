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

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getCurrentAdmin();
  if (!session) redirect("/admin/login");

  return (
    <>
      <Navbar />
      <header className="border-b border-brand-100 bg-surface">
        <div className="container-page flex flex-wrap items-center justify-between gap-3 py-3">
          <div className="flex items-center gap-3">
            <p className="text-sm font-semibold text-ink">Admin</p>
            <Badge tone="brand">{session.roleKeys[0] ?? "USER"}</Badge>
            <span className="text-sm text-ink-muted">{session.email}</span>
          </div>
          <div className="flex items-center gap-4">
            <nav aria-label="Admin sections" className="flex gap-4 text-sm">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="font-medium text-ink-muted hover:text-ink"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
            <form action={signOutAction}>
              <button
                type="submit"
                className="inline-flex h-9 items-center justify-center rounded-lg border border-brand-200 bg-white px-3 text-sm font-medium text-brand-800 transition-colors hover:bg-brand-50"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <AdminSubnav />
      <main id="main">{children}</main>
      <Footer />
    </>
  );
}
