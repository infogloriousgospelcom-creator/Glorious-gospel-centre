import Link from "next/link";

const links = [
  { href: "/about", label: "About" },
  { href: "/ministries", label: "Ministries" },
  { href: "/events", label: "Events" },
  { href: "/sermons", label: "Sermons" },
  { href: "/give", label: "Give" },
  { href: "/contact", label: "Contact" },
];

export function Navbar() {
  return (
    <header className="border-b border-brand-100 bg-white/95 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between">
        <Link href="/" className="font-serif text-xl font-semibold text-brand-900">
          Glorious Gospel Centre
        </Link>
        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-6 text-sm font-medium text-brand-700">
            {links.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-brand-900">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
