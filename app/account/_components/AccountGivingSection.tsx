import Link from "next/link";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/LinkButton";
import {
  formatGivingAmount,
  givingStatusLabel,
  type MemberGivingHistoryItem,
} from "@/services/member-giving";

function statusTone(status: string): "success" | "warning" | "danger" | "neutral" | "info" {
  switch (status) {
    case "SUCCESS":
      return "success";
    case "PENDING":
    case "PROCESSING":
      return "warning";
    case "FAILED":
      return "danger";
    case "CANCELLED":
      return "neutral";
    default:
      return "info";
  }
}

export function AccountGivingSection({
  items,
  loadOk,
}: {
  items: MemberGivingHistoryItem[];
  loadOk: boolean;
}) {
  if (!loadOk) {
    return (
      <Alert tone="danger" title="Unable to load giving history">
        We couldn&apos;t load your giving history right now. Please try again later.
      </Alert>
    );
  }

  if (items.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-ink-muted">
          No giving history is available for your account yet. Gifts you make while signed in
          will appear here.
        </p>
        <LinkButton href="/give">Give</LinkButton>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-3">
        {items.map((tx) => (
          <li
            key={tx.id}
            className="flex flex-wrap items-start justify-between gap-2 border-b border-border pb-3 last:border-0 last:pb-0"
          >
            <div className="min-w-0 flex-1">
              <p className="font-medium text-ink">
                {formatGivingAmount(tx.amount_cents, tx.currency)}
              </p>
              <p className="text-xs text-ink-muted">
                {tx.category_label ?? "Gift"}
                {" · "}
                {new Date(tx.created_at).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>
              {tx.external_reference ? (
                <p className="mt-1 font-mono text-xs text-ink-muted">
                  Ref: {tx.external_reference}
                </p>
              ) : null}
            </div>
            <Badge tone={statusTone(tx.status)}>{givingStatusLabel(tx.status)}</Badge>
          </li>
        ))}
      </ul>
      <p className="text-xs text-ink-muted">
        Showing your most recent gifts.{" "}
        <Link href="/give" className="font-medium text-brand-700 hover:underline">
          Make another gift
        </Link>
      </p>
    </div>
  );
}
