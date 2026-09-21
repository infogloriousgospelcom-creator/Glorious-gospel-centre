import { cn } from "@/lib/utils";

type Tone = "neutral" | "brand" | "accent" | "success" | "warning" | "danger" | "info" | "live";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-surface-inset text-ink-muted",
  brand:   "bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-100",
  accent:  "bg-accent-50 text-accent-700 ring-1 ring-inset ring-accent-200",
  success: "bg-success-50 text-success-700",
  warning: "bg-warning-50 text-warning-700",
  danger:  "bg-danger-50 text-danger-700",
  info:    "bg-info-50 text-info-700",
  live:    "bg-live-soft text-live-foreground ring-1 ring-inset ring-live/20",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}