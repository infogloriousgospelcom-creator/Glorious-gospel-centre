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
      className="sticky top-16 z-30 border-b border-border bg-surface-muted/95 backdrop-blur supports-[backdrop-filter]:bg-surface-muted/80"
    >
      <Container>
        <ul className="-mb-px flex flex-wrap gap-x-2 gap-y-1 py-2 text-sm font-medium">
          {links.map((l) => {
            const isActive = l.href === active;
            return (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className={
                    "inline-flex h-9 items-center rounded-md px-3 transition-colors " +
                    (isActive
                      ? "bg-white text-brand-800 shadow-soft"
                      : "text-ink-muted hover:bg-white/60 hover:text-brand-700")
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