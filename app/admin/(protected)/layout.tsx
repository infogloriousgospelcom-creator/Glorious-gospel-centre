import { redirect } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { signOutAction } from "@/services/auth.actions";
import { getCurrentAdmin } from "@/services/auth";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default async function ProtectedAdminLayout({ children }: { children: ReactNode }) {
  const session = await getCurrentAdmin();
  if (!session) redirect("/admin/login");

  return (
    <div className="min-h-dvh bg-surface-muted/50">
      <header className="sticky top-0 z-40 border-b border-border bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
          <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
            <p className="text-sm font-semibold text-brand-900">GGCC Admin</p>
            <Badge tone="brand">{session.roleKeys[0] ?? "USER"}</Badge>
            <span className="truncate text-sm text-ink-muted">{session.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="inline-flex h-9 items-center rounded-md px-3 text-sm font-medium text-ink-muted transition-colors hover:bg-brand-50 hover:text-brand-800"
            >
              View site
            </Link>
            <Link
              href="/admin/account"
              className="inline-flex h-9 items-center rounded-md px-3 text-sm font-medium text-ink-muted transition-colors hover:bg-brand-50 hover:text-brand-800"
            >
              Account
            </Link>
            <form action={signOutAction}>
              <Button type="submit" variant="secondary" size="sm">
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>

      <div className="lg:flex lg:min-h-[calc(100dvh-3.5rem)]">
        <AdminSidebar />
        <main id="main" className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
