import { cn } from "@/lib/utils";

export function SectionEyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "mb-3 text-sm font-medium uppercase tracking-[0.18em] text-brand-600",
        className,
      )}
    >
      {children}
    </p>
  );
}

export function SectionTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h2 className={cn("heading-2 mb-4 text-balance", className)}>{children}</h2>;
}

export function SectionLead({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("lead mx-auto max-w-2xl text-balance", className)}>{children}</p>;
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
    <div className="rounded-2xl border border-dashed border-brand-200 bg-surface-muted p-8 text-center">
      <p className="font-serif text-lg font-semibold text-ink">{title}</p>
      {description ? (
        <p className="mt-1 text-sm text-ink-muted">{description}</p>
      ) : null}
      {children}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="rounded-2xl border border-danger-600/30 bg-danger-50 p-6 text-center text-sm text-danger-700"
    >
      {message}
    </div>
  );
}
