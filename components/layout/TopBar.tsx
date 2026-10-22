import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { getSiteSettings } from "@/services/content";

export async function TopBar() {
  const settings = await getSiteSettings();
  const phone = settings.phone?.trim() || null;
  const email = settings.email?.trim() || null;

  return (
    <div className="bg-brand-900 text-brand-50">
      <Container className="flex h-9 items-center justify-between gap-3 text-xs">
        <p className="hidden truncate sm:block">
          Welcome to {settings.church_name}
        </p>
        <div className="ml-auto flex flex-wrap items-center justify-end gap-x-4 gap-y-1">
          {phone ? (
            <a
              href={`tel:${phone.replace(/\s+/g, "")}`}
              className="inline-flex min-h-touch items-center transition-colors duration-ui ease-smooth hover:text-accent-400 sm:min-h-0"
            >
              <span className="sr-only">Call </span>
              {phone}
            </a>
          ) : null}
          {email ? (
            <a
              href={`mailto:${email}`}
              className="hidden min-h-touch items-center transition-colors duration-ui ease-smooth hover:text-accent-400 md:inline-flex md:min-h-0"
            >
              <span className="sr-only">Email </span>
              {email}
            </a>
          ) : null}
          <Link
            href="/livestream"
            className="hidden min-h-touch items-center transition-colors duration-ui ease-smooth hover:text-accent-400 sm:inline-flex sm:min-h-0"
          >
            Watch Online
          </Link>
          <Link
            href="/visit"
            className="inline-flex min-h-touch items-center font-medium text-accent-400 transition-colors duration-ui ease-smooth hover:text-accent-300 sm:min-h-0"
          >
            Visit us
          </Link>
        </div>
      </Container>
    </div>
  );
}
