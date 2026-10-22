import { Badge } from "@/components/ui/Badge";
import type { ProfileCompleteness } from "@/lib/account-hub";

export function ProfileCompletenessIndicator({
  completeness,
}: {
  completeness: ProfileCompleteness;
}) {
  const { completed, total, hasName, hasPhone, emailConfirmed } = completeness;
  const tone = completed === total ? "success" : completed >= 2 ? "warning" : "neutral";

  return (
    <div className="space-y-2" aria-label={`Profile completeness ${completed} of ${total}`}>
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-medium text-ink">Profile completeness</p>
        <Badge tone={tone}>
          {completed}/{total}
        </Badge>
      </div>
      <ul className="text-xs text-ink-muted">
        <li>{emailConfirmed ? "Email verified" : "Email not verified yet"}</li>
        <li>{hasName ? "Full name added" : "Add your full name"}</li>
        <li>{hasPhone ? "Phone added" : "Phone optional — add if you like"}</li>
      </ul>
      <p className="text-xs text-ink-muted">
        Completeness is a helpful reminder only — it is not required to use Connect Groups.
      </p>
    </div>
  );
}
