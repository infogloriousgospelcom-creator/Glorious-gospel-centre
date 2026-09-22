"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/LinkButton";
import { membershipStatusLabel } from "@/lib/connect-group-members";
import type { OwnMembershipWithGroup } from "@/services/connect-group-membership";

function MembershipList({
  items,
  empty,
}: {
  items: OwnMembershipWithGroup[];
  empty: string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-ink-muted">{empty}</p>;
  }
  return (
    <ul className="space-y-3">
      {items.map((m) => (
        <li
          key={m.id}
          className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3 last:border-0 last:pb-0"
        >
          <div>
            {m.group_slug ? (
              <Link
                href={`/connect/${m.group_slug}`}
                className="font-medium text-brand-800 hover:text-brand-700"
              >
                {m.group_name ?? "Connect Group"}
              </Link>
            ) : (
              <span className="font-medium text-ink">{m.group_name ?? "Connect Group"}</span>
            )}
            <p className="text-xs text-ink-muted">{membershipStatusLabel(m.status)}</p>
            {(m.status === "DECLINED" || m.status === "LEFT" || m.status === "REMOVED") &&
            m.group_slug &&
            m.group_status === "OPEN" ? (
              <p className="mt-1 text-xs text-ink-muted">
                <Link
                  href={`/connect/${m.group_slug}`}
                  className="font-medium text-brand-700 hover:underline"
                >
                  Request to join again
                </Link>
              </p>
            ) : null}
          </div>
          <Badge
            tone={
              m.status === "ACTIVE"
                ? "success"
                : m.status === "PENDING"
                  ? "warning"
                  : "neutral"
            }
          >
            {m.status}
          </Badge>
        </li>
      ))}
    </ul>
  );
}

export function AccountMembershipSections({
  memberships,
}: {
  memberships: OwnMembershipWithGroup[];
}) {
  const active = memberships.filter((m) => m.status === "ACTIVE");
  const pending = memberships.filter((m) => m.status === "PENDING");
  const history = memberships.filter(
    (m) => m.status === "DECLINED" || m.status === "LEFT" || m.status === "REMOVED",
  );

  if (memberships.length === 0) {
    return (
      <p className="text-sm text-ink-muted">
        You have not requested membership in a Connect Group yet.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 text-sm font-semibold text-brand-900">Active</h3>
        <MembershipList items={active} empty="No active Connect Group memberships." />
      </div>
      <div>
        <h3 className="mb-2 text-sm font-semibold text-brand-900">Pending</h3>
        <MembershipList items={pending} empty="No pending membership requests." />
      </div>
      <div>
        <h3 className="mb-2 text-sm font-semibold text-brand-900">History</h3>
        <MembershipList
          items={history}
          empty="No previous declined, left, or removed memberships."
        />
      </div>
      <div className="flex flex-wrap gap-3 pt-2">
        <LinkButton href="/connect">Browse Connect Groups</LinkButton>
        <LinkButton href="/contact" variant="secondary">
          Contact the church
        </LinkButton>
      </div>
    </div>
  );
}
