import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { LinkButton } from "@/components/ui/LinkButton";
import { getSiteSettings, getActiveSocialLinks } from "@/services/content";

const groups = [
  {
    heading: "Church",
    links: [
      { href: "/about", label: "About" },
      { href: "/about/leadership", label: "Leadership" },
      { href: "/ministries", label: "Ministries" },
      { href: "/serve", label: "Serve" },
      { href: "/services", label: "Services" },
    ],
  },
  {
    heading: "Connect",
    links: [
      { href: "/prayer", label: "Prayer" },
      { href: "/testimonies", label: "Stories of Grace" },
      { href: "/contact", label: "Contact" },
      { href: "/events", label: "Events" },
      { href: "/livestream", label: "Watch Online" },
    ],
  },
  {
    heading: "Resources",
    links: [
      { href: "/sermons", label: "Sermons" },
      { href: "/gallery", label: "Gallery" },
      { href: "/about/story", label: "Our Story" },
      { href: "/privacy", label: "Privacy" },
    ],
  },
] as const;

export async function Footer() {
  const [settings, socials] = await Promise.all([
    getSiteSettings(),
    getActiveSocialLinks(),
  ]);

  const churchName = settings.church_name ?? "Glorious Gospel Centre Church";

  return (
    <footer className="mt-20 bg-brand-900 text-brand-50">
      <Container className="py-12 sm:py-14">
        <div className="grid gap-10 lg:grid-cols-[1.35fr_2fr]">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 transition-opacity duration-ui ease-smooth hover:opacity-90"
              aria-label={`${churchName} — Home`}
            >
              <span className="relative h-9 w-9 overflow-hidden rounded-md ring-1 ring-white/20">
                <Image
                  src="/logo.webp"
                  alt=""
                  width={36}
                  height={36}
                  className="h-9 w-9 object-contain"
                />
              </span>
              <span className="font-display text-base font-semibold leading-tight text-white">
                {churchName}
              </span>
            </Link>

            <p className="scripture mt-5 max-w-sm text-lg text-brand-50 sm:text-xl">
              &ldquo;If God be for us, who can be against us?&rdquo;
              <span className="scripture-ref text-accent-400">Romans 8:31</span>
            </p>

            {settings.tagline ? (
              <p className="mt-4 max-w-sm text-sm text-brand-100">{settings.tagline}</p>
            ) : null}

            <div className="mt-6 space-y-2 text-sm text-brand-100">
              {settings.address ? (
                <p className="whitespace-pre-line">{settings.address}</p>
              ) : null}
              {settings.phone ? (
                <p>
                  <a
                    className="transition-colors duration-ui ease-smooth hover:text-accent-400"
                    href={`tel:${settings.phone.replace(/\s+/g, "")}`}
                  >
                    {settings.phone}
                  </a>
                </p>
              ) : null}
              {settings.email ? (
                <p>
                  <a
                    className="transition-colors duration-ui ease-smooth hover:text-accent-400"
                    href={`mailto:${settings.email}`}
                  >
                    {settings.email}
                  </a>
                </p>
              ) : null}
            </div>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center">
              <LinkButton href="/visit" size="sm">
                Plan Your Visit
              </LinkButton>
              <LinkButton href="/give" variant="secondary" size="sm" className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white">
                Give
              </LinkButton>
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {groups.map((g) => (
              <div key={g.heading}>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-400">
                  {g.heading}
                </p>
                <ul className="mt-3 space-y-1 text-sm text-brand-100">
                  {g.links.map((l) => (
                    <li key={l.href}>
                      <Link
                        href={l.href}
                        className="inline-flex min-h-touch items-center transition-colors duration-ui ease-smooth hover:text-white sm:min-h-0 sm:py-0.5"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-brand-200 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {churchName}. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {socials.length > 0 ? (
              <ul className="flex flex-wrap items-center gap-3">
                {socials.slice(0, 5).map((s) => (
                  <li key={s.id}>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-touch items-center capitalize transition-colors duration-ui ease-smooth hover:text-white sm:min-h-0"
                    >
                      {s.platform}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
            <Link
              href="/admin/login"
              className="inline-flex min-h-touch items-center transition-colors duration-ui ease-smooth hover:text-white sm:min-h-0"
            >
              Admin
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}
