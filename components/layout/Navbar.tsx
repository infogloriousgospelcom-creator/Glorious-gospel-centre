"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect, useId, useRef } from "react";
import { cn } from "@/lib/utils";
import { LinkButton } from "@/components/ui/LinkButton";

const primaryLinks = [
  { href: "/", label: "Home", match: (p: string) => p === "/" },
  { href: "/about", label: "About", match: (p: string) => p === "/about" || p.startsWith("/about/") },
  {
    href: "/ministries",
    label: "Ministries",
    match: (p: string) => p === "/ministries" || p.startsWith("/ministries/"),
  },
  {
    href: "/sermons",
    label: "Sermons",
    match: (p: string) => p === "/sermons" || p.startsWith("/sermons/"),
  },
  {
    href: "/events",
    label: "Events",
    match: (p: string) => p === "/events" || p.startsWith("/events/"),
  },
] as const;

const moreLinks = [
  { href: "/services", label: "Services" },
  { href: "/gallery", label: "Gallery" },
  { href: "/prayer", label: "Prayer" },
  { href: "/contact", label: "Contact" },
  { href: "/about/leadership", label: "Leadership" },
  { href: "/livestream", label: "Watch Online" },
] as const;

function isMoreActive(pathname: string) {
  // About owns /about/* (including Leadership); only highlight More for other destinations.
  return moreLinks.some((l) => {
    if (l.href.startsWith("/about")) return false;
    return pathname === l.href || pathname.startsWith(`${l.href}/`);
  });
}

export function Navbar({
  accountHref = "/login",
  accountLabel = "Sign in",
}: {
  accountHref?: string;
  accountLabel?: string;
} = {}) {
  const [open, setOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const moreMenuId = useId();
  const mobileMenuId = useId();
  const pathname = usePathname() ?? "/";

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

  useEffect(() => {
    setOpen(false);
    setMoreOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!moreOpen) return;
    function onPointerDown(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMoreOpen(false);
        moreButtonRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [moreOpen]);

  const moreActive = isMoreActive(pathname);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="container-page flex h-16 items-center justify-between gap-3">
        <Link
          href="/"
          className="flex min-h-touch items-center gap-2.5 transition-opacity duration-ui ease-smooth hover:opacity-90"
          aria-label="Glorious Gospel Centre Church — Home"
        >
          <span className="relative h-9 w-9 overflow-hidden rounded-md ring-1 ring-border">
            <Image
              src="/logo.webp"
              alt=""
              width={36}
              height={36}
              className="h-9 w-9 object-contain"
              priority
            />
          </span>
          <span className="hidden flex-col leading-tight sm:flex">
            <span className="font-display text-sm font-semibold text-brand-900">
              Glorious Gospel
            </span>
            <span className="font-display text-xs font-medium uppercase tracking-[0.18em] text-brand-600">
              Centre Church
            </span>
          </span>
        </Link>

        <nav aria-label="Primary" className="hidden lg:block">
          <ul className="flex items-center gap-0.5 text-sm font-medium">
            {primaryLinks.map((link) => {
              const isActive = link.match(pathname);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "inline-flex h-10 items-center rounded-md px-3 text-ink-muted transition-colors duration-ui ease-smooth hover:bg-brand-50 hover:text-brand-800",
                      isActive && "bg-brand-50 text-brand-800",
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
            <li>
              <div className="relative" ref={moreRef}>
                <button
                  ref={moreButtonRef}
                  type="button"
                  aria-expanded={moreOpen}
                  aria-controls={moreMenuId}
                  aria-haspopup="true"
                  onClick={() => setMoreOpen((v) => !v)}
                  className={cn(
                    "inline-flex h-10 items-center gap-1 rounded-md px-3 text-ink-muted transition-colors duration-ui ease-smooth hover:bg-brand-50 hover:text-brand-800",
                    (moreOpen || moreActive) && "bg-brand-50 text-brand-800",
                  )}
                >
                  More
                  <svg
                    className={cn(
                      "h-3.5 w-3.5 transition-transform duration-ui ease-smooth",
                      moreOpen && "rotate-180",
                    )}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                {moreOpen ? (
                  <ul
                    id={moreMenuId}
                    role="menu"
                    aria-label="More pages"
                    className="absolute right-0 z-50 mt-2 min-w-[12rem] rounded-xl border border-border bg-white p-1.5 shadow-elevated"
                  >
                    {moreLinks.map((link) => {
                      const isActive =
                        pathname === link.href || pathname.startsWith(`${link.href}/`);
                      return (
                        <li key={link.href} role="none">
                          <Link
                            role="menuitem"
                            href={link.href}
                            aria-current={isActive ? "page" : undefined}
                            className={cn(
                              "flex min-h-touch items-center rounded-lg px-3 py-2 text-sm text-ink transition-colors duration-ui ease-smooth hover:bg-brand-50 hover:text-brand-800",
                              isActive && "bg-brand-50 font-medium text-brand-800",
                            )}
                            onClick={() => setMoreOpen(false)}
                          >
                            {link.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </div>
            </li>
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href={accountHref}
            className="hidden text-sm font-medium text-brand-800 transition-colors duration-ui ease-smooth hover:text-brand-600 sm:inline-flex"
          >
            {accountLabel}
          </Link>
          <LinkButton
            href="/visit"
            size="sm"
            className="hidden md:inline-flex"
          >
            Plan Your Visit
          </LinkButton>
          <LinkButton
            href="/give"
            variant="secondary"
            size="sm"
            className="hidden sm:inline-flex"
          >
            Give
          </LinkButton>

          <button
            ref={triggerRef}
            type="button"
            aria-controls={mobileMenuId}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
            className="touch-target rounded-md text-brand-800 transition-colors duration-ui ease-smooth hover:bg-brand-50 lg:hidden"
          >
            <span aria-hidden="true" className="relative block h-4 w-5">
              <span
                className={cn(
                  "absolute left-0 top-0 h-0.5 w-5 bg-current transition-transform duration-ui ease-smooth",
                  open && "translate-y-1.5 rotate-45",
                )}
              />
              <span
                className={cn(
                  "absolute left-0 top-1.5 h-0.5 w-5 bg-current transition-opacity duration-ui ease-smooth",
                  open && "opacity-0",
                )}
              />
              <span
                className={cn(
                  "absolute left-0 top-3 h-0.5 w-5 bg-current transition-transform duration-ui ease-smooth",
                  open && "-translate-y-1.5 -rotate-45",
                )}
              />
            </span>
          </button>
        </div>
      </div>

      <MobileMenu
        id={mobileMenuId}
        open={open}
        pathname={pathname}
        onClose={() => setOpen(false)}
        accountHref={accountHref}
        accountLabel={accountLabel}
      />
    </header>
  );
}

function MobileMenu({
  id,
  open,
  pathname,
  onClose,
  accountHref,
  accountLabel,
}: {
  id: string;
  open: boolean;
  pathname: string;
  onClose: () => void;
  accountHref: string;
  accountLabel: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const [moreExpanded, setMoreExpanded] = useState(false);
  const morePanelId = useId();

  useEffect(() => {
    if (!open) {
      setMoreExpanded(false);
      return;
    }
    const t = window.setTimeout(() => ref.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [open]);

  if (!open) return null;

  return (
    <nav
      id={id}
      ref={ref}
      tabIndex={-1}
      aria-label="Mobile primary"
      className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-border bg-white shadow-soft lg:hidden"
    >
      <div className="container-page space-y-4 py-4">
        <div className="grid gap-2">
          <LinkButton href={accountHref} variant="secondary" onClick={onClose} className="w-full">
            {accountLabel}
          </LinkButton>
          <LinkButton href="/visit" onClick={onClose} className="w-full">
            Plan Your Visit
          </LinkButton>
          <LinkButton href="/give" variant="secondary" onClick={onClose} className="w-full">
            Give
          </LinkButton>
        </div>

        <ul className="divide-y divide-border border-y border-border">
          {primaryLinks.map((link) => {
            const isActive = link.match(pathname);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={onClose}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex min-h-touch items-center justify-between py-3 text-base font-medium transition-colors duration-ui ease-smooth",
                    isActive ? "text-brand-800" : "text-ink hover:text-brand-700",
                  )}
                >
                  <span>{link.label}</span>
                  {isActive ? (
                    <span aria-hidden="true" className="h-2 w-2 rounded-full bg-accent-400" />
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>

        <div>
          <button
            type="button"
            aria-expanded={moreExpanded}
            aria-controls={morePanelId}
            onClick={() => setMoreExpanded((v) => !v)}
            className="flex min-h-touch w-full items-center justify-between rounded-lg px-1 text-left text-base font-medium text-ink transition-colors duration-ui ease-smooth hover:text-brand-700"
          >
            More
            <svg
              className={cn(
                "h-4 w-4 text-ink-muted transition-transform duration-ui ease-smooth",
                moreExpanded && "rotate-180",
              )}
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          {moreExpanded ? (
            <ul id={morePanelId} className="mt-1 space-y-0.5 border-l-2 border-brand-100 pl-3">
              {moreLinks.map((link) => {
                const isActive =
                  pathname === link.href || pathname.startsWith(`${link.href}/`);
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={onClose}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "flex min-h-touch items-center rounded-md px-2 text-sm transition-colors duration-ui ease-smooth",
                        isActive
                          ? "font-medium text-brand-800"
                          : "text-ink-muted hover:text-brand-700",
                      )}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      </div>
    </nav>
  );
}
