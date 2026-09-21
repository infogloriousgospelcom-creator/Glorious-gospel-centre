import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Container({
  children,
  className,
  width = "page",
}: {
  children: ReactNode;
  className?: string;
  /** page = site max width; content = readable article; prose = narrow copy */
  width?: "page" | "content" | "prose" | "full";
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 sm:px-6 lg:px-8",
        width === "page" && "max-w-7xl",
        width === "content" && "max-w-content",
        width === "prose" && "max-w-prose",
        width === "full" && "max-w-none",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Section({
  children,
  className,
  as: Tag = "section",
  spacing = "default",
  id,
}: {
  children: ReactNode;
  className?: string;
  as?: "section" | "div" | "article";
  /** default = py-section / section-lg; compact for denser bands */
  spacing?: "default" | "compact" | "none";
  id?: string;
}) {
  return (
    <Tag
      id={id}
      className={cn(
        spacing === "default" && "py-section sm:py-section-lg",
        spacing === "compact" && "py-10 sm:py-14",
        spacing === "none" && "py-0",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
