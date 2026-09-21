import { cn } from "@/lib/utils";

export function SectionEyebrow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <p className={cn("eyebrow", className)}>{children}</p>;
}

export function SectionTitle({
  children,
  className,
  as: Tag = "h2",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "h1" | "h2" | "h3";
}) {
  const headingClass =
    Tag === "h1" ? "heading-1" : Tag === "h3" ? "heading-3" : "heading-2";
  return <Tag className={cn(headingClass, "mb-4 text-balance", className)}>{children}</Tag>;
}

export function SectionLead({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <p className={cn("lead mx-auto max-w-2xl text-balance", className)}>{children}</p>;
}

/**
 * One-purpose section intro: eyebrow + title + optional lead + hairline.
 */
export function SectionHeading({
  eyebrow,
  title,
  lead,
  align = "left",
  className,
  titleAs = "h2",
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  align?: "left" | "center";
  className?: string;
  titleAs?: "h1" | "h2" | "h3";
}) {
  return (
    <div
      className={cn(
        "mb-10 max-w-3xl",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      {eyebrow ? <SectionEyebrow>{eyebrow}</SectionEyebrow> : null}
      <SectionTitle as={titleAs} className={align === "center" ? undefined : "text-left"}>
        {title}
      </SectionTitle>
      <div
        className={cn("hairline mb-5", align === "center" ? "mx-auto" : "ml-0")}
        aria-hidden="true"
      />
      {lead ? (
        <SectionLead className={align === "left" ? "mx-0" : undefined}>{lead}</SectionLead>
      ) : null}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-brand-200 bg-brand-50/40 px-6 py-10 text-center sm:px-8">
      <p className="font-display text-lg font-semibold text-brand-900">{title}</p>
      {description ? <p className="mt-2 text-sm leading-relaxed text-ink-muted">{description}</p> : null}
      {children ? (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">{children}</div>
      ) : null}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  message,
  children,
}: {
  title?: string;
  message: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      role="alert"
      className="rounded-2xl border border-danger-600/30 bg-danger-50 px-6 py-8 text-center"
    >
      <p className="font-display text-base font-semibold text-danger-700">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-danger-700/90">{message}</p>
      {children ? (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">{children}</div>
      ) : null}
    </div>
  );
}
