import Link, { type LinkProps } from "next/link";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { buttonClassName } from "@/components/ui/Button";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "link" | "accent";
type Size = "sm" | "md" | "lg";

export type LinkButtonProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> & {
    variant?: Variant;
    size?: Size;
    children: ReactNode;
    className?: string;
  };

/**
 * Next.js Link styled as a Button. Prefer this over nesting <Button> inside <Link>.
 */
export function LinkButton({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: LinkButtonProps) {
  return (
    <Link className={buttonClassName({ variant, size, className })} {...props}>
      {children}
    </Link>
  );
}
