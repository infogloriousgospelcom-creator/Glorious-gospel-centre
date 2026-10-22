import Link from "next/link";
import { Container, Section } from "@/components/ui/Container";
import { SectionEyebrow, SectionTitle, SectionLead } from "@/components/ui/Section";
import { LinkButton } from "@/components/ui/LinkButton";
import { SectionReveal } from "@/components/motion/SectionReveal";
import { cn } from "@/lib/utils";

export interface NextStepAction {
  href: string;
  label: string;
  description?: string;
  variant?: "primary" | "secondary" | "ghost";
}

export function ContextualNextSteps({
  eyebrow = "Next steps",
  title,
  description,
  actions,
  className,
  surface = "default",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions: NextStepAction[];
  className?: string;
  surface?: "default" | "muted" | "brand";
}) {
  if (actions.length === 0) return null;

  const surfaceClass =
    surface === "muted"
      ? "bg-surface-muted"
      : surface === "brand"
        ? "bg-brand-900 text-brand-50"
        : undefined;

  return (
    <Section className={cn(surfaceClass, className)}>
      <Container width="prose" className="text-center">
        <SectionReveal>
          <SectionEyebrow
            className={surface === "brand" ? "text-accent-400" : undefined}
          >
            {eyebrow}
          </SectionEyebrow>
          <SectionTitle className={surface === "brand" ? "text-white" : undefined}>
            {title}
          </SectionTitle>
          {description ? (
            <SectionLead
              className={cn(
                "mx-auto",
                surface === "brand" ? "text-brand-100" : undefined,
              )}
            >
              {description}
            </SectionLead>
          ) : null}
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
            {actions.map((action) => (
              <LinkButton
                key={`${action.href}-${action.label}`}
                href={action.href}
                variant={
                  surface === "brand" && action.variant === "ghost"
                    ? "ghost"
                    : action.variant ?? "primary"
                }
                className={
                  surface === "brand" && (action.variant === "ghost" || action.variant === "secondary")
                    ? "border-white/30 text-white hover:bg-white/10 hover:text-white"
                    : undefined
                }
              >
                {action.label}
              </LinkButton>
            ))}
          </div>
          {actions.some((a) => a.description) ? (
            <ul className="mx-auto mt-8 max-w-xl space-y-2 text-left text-sm text-ink-muted">
              {actions
                .filter((a) => a.description)
                .map((a) => (
                  <li key={a.href}>
                    <Link href={a.href} className="brand-link font-medium">
                      {a.label}
                    </Link>
                    <span className="text-ink-muted"> — {a.description}</span>
                  </li>
                ))}
            </ul>
          ) : null}
        </SectionReveal>
      </Container>
    </Section>
  );
}
