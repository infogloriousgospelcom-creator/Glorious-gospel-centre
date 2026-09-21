import Link from "next/link";

export function HeroSection() {
  return (
    <section
      className="hero relative flex items-center overflow-hidden"
      style={{ minHeight: "max(60vh, 420px)" }}
    >
      {/* Background image — overlay version (has built-in dark gradient) */}
      <div
        className="hero-bg absolute inset-0 z-0"
        aria-hidden="true"
      />

      {/* Additional CSS gradient overlay for extra legibility */}
      <div
        className="absolute inset-0 z-[1]"
        style={{
          background:
            "linear-gradient(180deg, rgba(26,18,16,0.18) 0%, rgba(26,18,16,0.12) 40%, rgba(26,18,16,0.50) 100%)",
        }}
        aria-hidden="true"
      />

      {/* Content */}
      <div className="relative z-10 w-full py-20 md:py-0">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            {/* Eyebrow / kicker */}
            <p className="hero-eyebrow mb-5 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-[var(--brand-yellow)] sm:text-xs md:mb-6">
              Welcome To
            </p>

            {/* Headline */}
            <h1
              className="hero-headline text-[clamp(2.25rem,5vw,4.5rem)] font-semibold leading-[1.05] tracking-[-0.01em] text-[var(--cream)] sm:text-[clamp(2.5rem,4.5vw,5rem)]"
              style={{ fontFamily: "var(--font-display-serif), Georgia, serif" }}
            >
              Glorious Gospel Centre
              <br className="hidden sm:block" />
              <span className="sm:hidden"> </span>
              Church
            </h1>

            {/* Decorative accent line */}
            <div
              className="hero-accent my-5 h-px w-16 bg-gradient-to-r from-[var(--gold)] to-transparent md:my-6 md:w-20"
              aria-hidden="true"
            />

            {/* Scripture line */}
            <p
              className="hero-scripture mt-6 max-w-lg text-base italic text-[var(--cream)] sm:text-lg md:mt-7 md:text-xl"
              style={{ fontFamily: "var(--font-display-serif), Georgia, serif" }}
            >
              &ldquo;If God be for us, who can be against us?&rdquo;
              <span className="mt-1 block text-xs not-italic text-[var(--brand-yellow)]/80 sm:text-sm md:mt-1.5">
                Romans 8:31
              </span>
            </p>

            {/* Supporting statement */}
            <p className="hero-support mt-5 max-w-lg text-sm leading-relaxed text-white sm:text-base md:mt-6 md:text-lg md:leading-relaxed">
              A Christ-centered community in Kenya, gathered to worship, grow in
              the Word, and serve our neighbors.
            </p>

            {/* CTA buttons */}
            <div className="hero-ctas mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 md:mt-8">
              <Link
                href="/contact"
                className="group inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[var(--brand-red)] px-7 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[var(--brand-red)]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-yellow)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent sm:h-13 sm:px-8 sm:text-[0.9rem]"
              >
                Plan Your Visit
                <svg
                  className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link
                href="/livestream"
                className="group inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-[var(--cream)]/30 px-7 text-sm font-medium text-[var(--cream)]/90 transition-all duration-300 hover:border-[var(--cream)]/50 hover:bg-[var(--cream)]/5 hover:text-[var(--cream)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-yellow)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent sm:h-13 sm:px-8 sm:text-[0.9rem]"
              >
                <svg
                  className="h-4 w-4 opacity-80"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Watch Live
              </Link>
            </div>

          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 sm:bottom-8 md:bottom-10">
          <a
            href="#welcome"
            className="scroll-indicator group flex flex-col items-center gap-1.5 text-[var(--cream)]/40 transition-colors duration-300 hover:text-[var(--cream)]/70"
            aria-label="Scroll to next section"
          >
            <span className="text-[9px] font-medium uppercase tracking-[0.2em] opacity-0 transition-opacity duration-300 group-hover:opacity-100 md:text-[10px]">
              Scroll
            </span>
            <svg
              className="h-4 w-4 md:h-5 md:w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
