"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/about", label: "About" },
  { href: "/ministries", label: "Ministries" },
  { href: "/services", label: "Services" },
  { href: "/events", label: "Events" },
  { href: "/sermons", label: "Sermons" },
  { href: "/gallery", label: "Gallery" },
  { href: "/give", label: "Give" },
  { href: "/prayer", label: "Prayer" },
  { href: "/contact", label: "Contact" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-brand-100 bg-surface/90 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between">
        <Link
          href="/"
          className="font-serif text-xl font-semibold text-ink"
          onClick={() => setOpen(false)}
        >
          Glorious Gospel Centre
        </Link>

        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-6 text-sm font-medium text-ink-muted">
            {links.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-ink">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <button
          ref={triggerRef}
          type="button"
          aria-controls="mobile-menu"
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-ink hover:bg-brand-50 md:hidden"
        >
          <span aria-hidden="true" className="relative block h-4 w-5">
            <span
              className={cn(
                "absolute left-0 top-0 h-0.5 w-5 bg-current transition-transform",
                open && "translate-y-1.5 rotate-45",
              )}
            />
            <span
              className={cn(
                "absolute left-0 top-1.5 h-0.5 w-5 bg-current transition-opacity",
                open && "opacity-0",
              )}
            />
            <span
              className={cn(
                "absolute left-0 top-3 h-0.5 w-5 bg-current transition-transform",
                open && "-translate-y-1.5 -rotate-45",
              )}
            />
          </span>
        </button>
      </div>

      <MobileMenu open={open} onClose={() => setOpen(false)} />
    </header>
  );
}

function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    // Move focus to the menu container so keyboard users land inside.
    const t = window.setTimeout(() => ref.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [open]);

  if (!open) return null;
  return (
    <nav
      id="mobile-menu"
      ref={ref}
      tabIndex={-1}
      aria-label="Mobile primary"
      className="border-t border-brand-100 bg-surface md:hidden"
    >
      <ul className="container-page divide-y divide-brand-100 py-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              onClick={onClose}
              className="block py-3 text-base font-medium text-ink hover:text-brand-700"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
