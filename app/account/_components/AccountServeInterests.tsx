import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/LinkButton";
import {
  serveInterestStatusExplanation,
  serveInterestStatusLabel,
  type OwnServeInterest,
} from "@/lib/ministry-serve-interest";

function toneFor(status: string): "info" | "success" | "warning" | "neutral" {
  if (status === "ACCEPTED") return "success";
  if (status === "CONTACTED" || status === "NEW") return "info";
  if (status === "DECLINED") return "warning";
  return "neutral";
}

export function AccountServeInterests({
  items,
  loadOk,
}: {
  items: OwnServeInterest[];
  loadOk: boolean;
}) {
  if (!loadOk) {
    return <p className="text-sm text-ink-muted">Serving interests could not be loaded right now.</p>;
  }

  if (items.length === 0) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-ink-muted">
          You have not expressed interest in serving yet. Browse ministries and tell the church
          where you would like to help.
        </p>
        <LinkButton href="/serve" variant="secondary" size="sm">
          Express interest
        </LinkButton>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border">
      {items.slice(0, 5).map((item) => (
        <li key={item.id} className="py-3 first:pt-0 last:pb-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-brand-900">
              {item.ministry_name ?? "General serving"}
            </p>
            <Badge tone={toneFor(item.status)}>{serveInterestStatusLabel(item.status)}</Badge>
          </div>
          <p className="mt-1 text-sm text-ink-muted">{serveInterestStatusExplanation(item.status)}</p>
          <p className="mt-1 text-xs text-ink-muted">
            Submitted {new Date(item.created_at).toLocaleDateString()}
          </p>
        </li>
      ))}
    </ul>
  );
}
