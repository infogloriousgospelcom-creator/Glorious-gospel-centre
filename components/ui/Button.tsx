import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "link" | "accent";
type Size = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
}

export const buttonVariantClasses: Record<Variant, string> = {
  primary:
    "bg-brand-700 text-white hover:bg-brand-800 active:bg-brand-900 disabled:bg-brand-300",
  accent:
    "bg-accent-400 text-brand-900 hover:bg-accent-500 hover:text-brand-950 active:bg-accent-600 disabled:bg-accent-200 disabled:text-brand-900/60",
  secondary:
    "bg-white text-brand-800 border border-brand-200 hover:bg-brand-50 hover:border-brand-300 active:bg-brand-100 disabled:opacity-60",
  ghost:
    "bg-transparent text-brand-700 hover:bg-brand-50 active:bg-brand-100 disabled:opacity-60",
  danger:
    "bg-danger-600 text-white hover:bg-danger-700 active:bg-danger-700 disabled:opacity-60",
  link:
    "bg-transparent text-brand-700 underline-offset-4 hover:underline px-0 py-0 h-auto min-h-0",
};

export const buttonSizeClasses: Record<Size, string> = {
  sm: "h-9 min-h-9 px-3.5 text-sm",
  md: "h-11 min-h-touch px-5 text-sm",
  lg: "h-12 min-h-12 px-6 text-base",
};

export function buttonClassName({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: Variant;
  size?: Size;
  className?: string;
} = {}) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-lg font-medium",
    "transition-all duration-ui ease-smooth",
    "motion-safe:hover:-translate-y-px motion-safe:active:translate-y-0",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2",
    "disabled:cursor-not-allowed disabled:translate-y-0",
    buttonVariantClasses[variant],
    buttonSizeClasses[size],
    className,
  );
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", isLoading = false, disabled, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={buttonClassName({ variant, size, className })}
      aria-busy={isLoading || undefined}
      {...props}
    >
      {isLoading ? (
        <span
          aria-hidden="true"
          className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"
        />
      ) : null}
      <span>{children}</span>
    </button>
  );
});
