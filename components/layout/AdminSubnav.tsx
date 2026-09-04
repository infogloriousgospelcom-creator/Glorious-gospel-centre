import Link from "next/link";
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

export function AdminSubnav({ active }: { active?: string }) {
  return (
    <nav
      aria-label="Admin sections"
      className="sticky top-16 z-30 border-b border-brand-100 bg-surface/95 backdrop-blur"
    >
      <Container>
        <ul className="-mb-px flex flex-wrap gap-x-5 gap-y-1 overflow-x-auto py-2 text-sm font-medium text-ink-muted">
          {links.map((l) => {
            const isActive = active ? l.href === active || l.href.startsWith(`${active}/`) : false;
            return (
              <li key={l.href}>
                <Link
                  href={l.href}
                  aria-current={isActive ? "page" : undefined}
                  className={
                    isActive
                      ? "border-b-2 border-brand-700 pb-1.5 text-ink"
                      : "hover:text-ink"
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
