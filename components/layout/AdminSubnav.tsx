"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Container } from "@/components/ui/Container";

const links = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/announcements", label: "Announcements" },
  { href: "/admin/events", label: "Events" },
  { href: "/admin/sermons", label: "Sermons" },
  { href: "/admin/series", label: "Series" },
  { href: "/admin/ministries", label: "Ministries" },
  { href: "/admin/leadership", label: "Leadership" },
  { href: "/admin/services", label: "Services" },
  { href: "/admin/pages", label: "Pages" },
  { href: "/admin/gallery", label: "Gallery" },
  { href: "/admin/prayer-requests", label: "Prayer" },
  { href: "/admin/messages", label: "Messages" },
  { href: "/admin/giving", label: "Giving" },
  { href: "/admin/approvals", label: "Approvals" },
  { href: "/admin/audit", label: "Audit" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/account", label: "Account" },
];

export function AdminSubnav() {
  const pathname = usePathname() ?? "";
  return (
    <nav
      aria-label="Admin sections"
      className="sticky top-16 z-30 border-b border-brand-100 bg-brand-50/40 backdrop-blur supports-[backdrop-filter]:bg-brand-50/30"
    >
      <Container>
        <ul className="-mb-px flex flex-wrap gap-x-1 gap-y-1 overflow-x-auto py-2 text-sm font-medium">
          {links.map((l) => {
            const isActive = pathname === l.href || pathname.startsWith(`${l.href}/`);
            return (
              <li key={l.href}>
                <Link
                  href={l.href}
                  aria-current={isActive ? "page" : undefined}
                  className={
                    "inline-flex h-9 items-center rounded-md px-3 transition-colors " +
                    (isActive
                      ? "bg-brand-50 text-brand-800 ring-1 ring-inset ring-brand-100"
                      : "text-ink-muted hover:bg-brand-50 hover:text-brand-800")
                  }
                >
                  {l.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </Container>
    </nav>
  );
}