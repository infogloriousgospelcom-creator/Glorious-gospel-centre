import Link from "next/link";
import { Container } from "@/components/ui/Container";

const links = [
  { href: "/about", label: "Overview" },
  { href: "/about/story", label: "Our Story" },
  { href: "/about/vision-mission", label: "Vision & Mission" },
  { href: "/about/statement-of-faith", label: "Statement of Faith" },
  { href: "/about/leadership", label: "Leadership" },
];

export function AboutSubnav({ active }: { active: string }) {
  return (
    <nav
      aria-label="About sections"
      className="border-b border-brand-100 bg-surface-muted"
    >
      <Container>
        <ul className="-mb-px flex flex-wrap gap-x-6 gap-y-1 py-3 text-sm font-medium text-ink-muted">
          {links.map((l) => {
            const isActive = l.href === active;
            return (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className={
                    isActive
                      ? "border-b-2 border-brand-700 pb-2 text-ink"
                      : "hover:text-ink"
                  }
                  aria-current={isActive ? "page" : undefined}
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
