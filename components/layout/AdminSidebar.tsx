"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId, useState } from "react";
import { cn } from "@/lib/utils";

const groups: { title: string; items: { href: string; label: string }[] }[] = [
  {
    title: "Overview",
    items: [{ href: "/admin/dashboard", label: "Dashboard" }],
  },
  {
    title: "Content",
    items: [
      { href: "/admin/announcements", label: "Announcements" },
      { href: "/admin/events", label: "Events" },
      { href: "/admin/sermons", label: "Sermons" },
      { href: "/admin/series", label: "Series" },
      { href: "/admin/ministries", label: "Ministries" },
      { href: "/admin/leadership", label: "Leadership" },
      { href: "/admin/services", label: "Services" },
      { href: "/admin/pages", label: "Pages" },
      { href: "/admin/gallery", label: "Gallery" },
    ],
  },
  {
    title: "Engage",
    items: [
      { href: "/admin/prayer-requests", label: "Prayer" },
      { href: "/admin/testimonies", label: "Testimonies" },
      { href: "/admin/connect-groups", label: "Connect Groups" },
      { href: "/admin/messages", label: "Messages" },
      { href: "/admin/giving", label: "Giving" },
    ],
  },
  {
    title: "Operations",
    items: [
      { href: "/admin/approvals", label: "Approvals" },
      { href: "/admin/audit", label: "Audit" },
      { href: "/admin/users", label: "Users" },
      { href: "/admin/settings", label: "Settings" },
    ],
  },
  {
    title: "You",
    items: [{ href: "/admin/account", label: "Account" }],
  },
];

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavGroups({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <div key={group.title}>
          <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
            {group.title}
          </p>
          <ul className="mt-1.5 space-y-0.5">
            {group.items.map((item) => {
              const active = isActivePath(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-h-9 items-center rounded-md px-3 text-sm transition-colors duration-ui ease-smooth",
                      active
                        ? "bg-brand-100 font-medium text-brand-900"
                        : "text-ink-muted hover:bg-brand-50 hover:text-brand-800",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function AdminSidebar() {
  const pathname = usePathname() ?? "";
  const [open, setOpen] = useState(false);
  const panelId = useId();

  const current =
    groups.flatMap((g) => g.items).find((i) => isActivePath(pathname, i.href))?.label ??
    "Admin";

  return (
    <>
      <div className="border-b border-border bg-white px-4 py-2 lg:hidden">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
          className="inline-flex min-h-touch w-full items-center justify-between rounded-md border border-border px-3 text-sm font-medium text-brand-900"
        >
          <span>Menu · {current}</span>
          <span aria-hidden="true" className="text-ink-muted">
            {open ? "−" : "+"}
          </span>
        </button>
        {open ? (
          <nav id={panelId} aria-label="Admin sections" className="mt-3 pb-2">
            <NavGroups pathname={pathname} onNavigate={() => setOpen(false)} />
          </nav>
        ) : null}
      </div>

      <aside className="hidden w-56 shrink-0 border-r border-border bg-white lg:block">
        <nav aria-label="Admin sections" className="sticky top-0 max-h-[calc(100dvh-3.5rem)] overflow-y-auto p-3">
          <NavGroups pathname={pathname} />
        </nav>
      </aside>
    </>
  );
}
