import Link from "next/link";
import { Container } from "@/components/ui/Container";

const groups = [
  {
    heading: "Connect",
    links: [
      { href: "/about", label: "About" },
      { href: "/leadership", label: "Leadership" },
      { href: "/ministries", label: "Ministries" },
      { href: "/services", label: "Services" },
    ],
  },
  {
    heading: "Engage",
    links: [
      { href: "/events", label: "Events" },
      { href: "/sermons", label: "Sermons" },
      { href: "/gallery", label: "Gallery" },
      { href: "/livestream", label: "Livestream" },
    ],
  },
  {
    heading: "Support",
    links: [
      { href: "/give", label: "Give" },
      { href: "/prayer", label: "Prayer Request" },
      { href: "/orphans", label: "Orphans Ministry" },
      { href: "/feeding", label: "Feeding Programme" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-16 border-t border-brand-100 bg-brand-50">
      <Container className="py-12">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <p className="font-serif text-lg font-semibold text-ink">
              Glorious Gospel Centre
            </p>
            <p className="mt-2 text-sm text-ink-muted">
              A worshiping community committed to the Word, prayer, and outreach.
            </p>
          </div>
          {groups.map((g) => (
            <div key={g.heading}>
              <p className="text-sm font-semibold uppercase tracking-wider text-ink">
                {g.heading}
              </p>
              <ul className="mt-3 space-y-2 text-sm text-ink-muted">
                {g.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="hover:text-ink">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col gap-3 border-t border-brand-200 pt-6 text-xs text-ink-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Glorious Gospel Centre. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-ink">
              Privacy
            </Link>
            <Link href="/admin/login" className="hover:text-ink">
              Admin
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}
