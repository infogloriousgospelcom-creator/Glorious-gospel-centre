import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type Tone = "success" | "warning" | "danger" | "info";

const toneClasses: Record<Tone, string> = {
  success: "border-success-600/30 bg-success-50 text-success-700",
  warning: "border-warning-600/30 bg-warning-50 text-warning-700",
  danger: "border-danger-600/30 bg-danger-50 text-danger-700",
  info: "border-info-600/30 bg-info-50 text-info-700",
};

export function Alert({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: Tone;
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      role={tone === "danger" || tone === "warning" ? "alert" : "status"}
      className={cn("rounded-xl border p-4 text-sm", toneClasses[tone], className)}
    >
      {title ? <p className="mb-1 font-semibold">{title}</p> : null}
      <div className="leading-relaxed">{children}</div>
    </div>
  );
}
