import Link from "next/link";
import { LinkButton } from "@/components/ui/LinkButton";
import type { AccountNextStepsResult } from "@/lib/account-hub";

/**
 * Compact next-steps block for /account (not the full-bleed ContextualNextSteps section).
 */
export function AccountNextStepsPanel({ steps }: { steps: AccountNextStepsResult }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-brand-900">{steps.title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-ink-muted">{steps.description}</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <LinkButton href={steps.primary.href} variant={steps.primary.variant ?? "primary"}>
          {steps.primary.label}
        </LinkButton>
        {steps.secondary.slice(0, 3).map((a) => (
          <LinkButton key={`${a.href}-${a.label}`} href={a.href} variant={a.variant ?? "secondary"}>
            {a.label}
          </LinkButton>
        ))}
      </div>
      {steps.secondary.some((a) => a.description) ? (
        <ul className="space-y-1 text-sm text-ink-muted">
          {steps.secondary
            .filter((a) => a.description)
            .map((a) => (
              <li key={`${a.href}-desc`}>
                <Link href={a.href} className="font-medium text-brand-800 hover:text-brand-700">
                  {a.label}
                </Link>
                <span> — {a.description}</span>
              </li>
            ))}
        </ul>
      ) : null}
    </div>
  );
}
