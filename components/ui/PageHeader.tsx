import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Container, Section } from "@/components/ui/Container";
import { SectionEyebrow, SectionTitle, SectionLead } from "@/components/ui/Section";

export interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  variant?: "default" | "accent" | "plain";
  className?: string;
  /** Optional CTAs or controls under the lead */
  children?: ReactNode;
  align?: "center" | "left";
}

export function PageHeader({
  eyebrow,
  title,
  description,
  variant = "default",
  className,
  children,
  align = "center",
}: PageHeaderProps) {
  const surfaceClass =
    variant === "accent"
      ? "bg-gradient-to-br from-brand-50 via-surface to-accent-50"
      : variant === "plain"
        ? "bg-surface"
        : "bg-gradient-to-br from-brand-50 via-white to-brand-50/60";

  return (
    <Section className={cn(surfaceClass, className)}>
      <Container>
        <div
          className={cn(
            "max-w-3xl",
            align === "center" && "mx-auto text-center",
            align === "left" && "mr-auto text-left",
          )}
        >
          {eyebrow ? <SectionEyebrow>{eyebrow}</SectionEyebrow> : null}
          <SectionTitle className={align === "center" ? undefined : "text-left"}>
            {title}
          </SectionTitle>
          <div
            className={cn(
              "hairline mt-1 mb-5",
              align === "center" ? "mx-auto" : "ml-0",
            )}
            aria-hidden="true"
          />
          {description ? (
            <SectionLead className={align === "left" ? "mx-0" : undefined}>
              {description}
            </SectionLead>
          ) : null}
          {children ? (
            <div
              className={cn(
                "mt-8 flex flex-col gap-3 sm:flex-row sm:items-center",
                align === "center" && "justify-center",
              )}
            >
              {children}
            </div>
          ) : null}
        </div>
      </Container>
    </Section>
  );
}
