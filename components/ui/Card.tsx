import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  as?: "div" | "article" | "section";
  hoverable?: boolean;
}

export function Card({ as: Tag = "div", className, hoverable = false, ...props }: CardProps) {
  return (
    <Tag
      className={cn(
        "rounded-2xl border border-border bg-surface shadow-soft",
        "transition-all duration-ui ease-smooth",
        hoverable &&
          "motion-safe:hover:-translate-y-1 hover:border-brand-200 hover:shadow-elevated",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-6 pb-3", className)} {...props} />;
}

export function CardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-6 py-3", className)} {...props} />;
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-center justify-between gap-3 border-t border-border p-6", className)}
      {...props}
    />
  );
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h3 className={cn("font-display text-xl font-semibold text-brand-900", className)}>{children}</h3>;
}

export function CardDescription({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("mt-1 text-sm leading-relaxed text-ink-muted", className)}>{children}</p>;
}