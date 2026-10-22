import { LinkButton } from "@/components/ui/LinkButton";

/**
 * Full-bleed hero — brand, scripture identity, one support line, CTA pair.
 * Schedule / secondary marketing stay below the fold (Phase C IA).
 */
export function HeroSection() {
  return (
    <section
      className="hero relative flex items-center overflow-hidden"
      aria-label="Welcome"
    >
      <div className="hero-bg absolute inset-0 z-0" aria-hidden="true" />
      <div
        className="absolute inset-0 z-[1]"
        style={{
          background:
            "linear-gradient(180deg, rgba(10,21,84,0.35) 0%, rgba(10,21,84,0.25) 45%, rgba(10,21,84,0.72) 100%)",
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full py-20 md:py-0">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="hero-eyebrow mb-5 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-accent-400 sm:text-xs md:mb-6">
              Welcome
            </p>

            <h1
              className="hero-headline text-[clamp(2.25rem,5vw,4.25rem)] font-semibold leading-[1.05] tracking-[-0.01em] text-white"
              style={{ fontFamily: "var(--font-display-serif), Georgia, serif" }}
            >
              Glorious Gospel Centre Church
            </h1>

            <div
              className="hero-accent my-5 h-px w-16 bg-gradient-to-r from-accent-400 to-transparent md:my-6 md:w-20"
              aria-hidden="true"
            />

            <p
              className="hero-scripture mt-5 max-w-xl text-base italic text-white/95 sm:text-lg md:text-xl"
              style={{ fontFamily: "var(--font-display-serif), Georgia, serif" }}
            >
              &ldquo;If God be for us, who can be against us?&rdquo;
              <span className="mt-1.5 block text-xs not-italic tracking-wide text-accent-400 sm:text-sm">
                Romans 8:31
              </span>
            </p>

            <p className="hero-support mt-5 max-w-lg text-sm leading-relaxed text-white/90 sm:text-base md:mt-6">
              Glorious Gospel Centre Church — worship with us in Kitengela, or join online.
            </p>

            <div className="hero-ctas mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 md:mt-8">
              <LinkButton href="/visit" size="lg" className="bg-brand-700 hover:bg-brand-800">
                Plan Your Visit
              </LinkButton>
              <LinkButton
                href="/livestream"
                variant="ghost"
                size="lg"
                className="border border-white/40 text-white hover:border-white/60 hover:bg-white/10 hover:text-white"
              >
                Watch Online
              </LinkButton>
            </div>
          </div>
        </div>

        <div className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 sm:bottom-8 md:bottom-10">
          <a
            href="#sunday-services"
            className="scroll-indicator group flex flex-col items-center gap-1.5 text-white/40 transition-colors duration-ui ease-smooth hover:text-white/70"
            aria-label="Scroll to Sunday services"
          >
            <span className="text-[9px] font-medium uppercase tracking-[0.2em] opacity-0 transition-opacity duration-ui group-hover:opacity-100 md:text-[10px]">
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
