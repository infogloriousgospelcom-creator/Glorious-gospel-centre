"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import type { ReactNode } from "react";
import {
  leaveConnectGroupAction,
  type MembershipActionState,
} from "@/services/connect-group-membership.actions";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LinkButton } from "@/components/ui/LinkButton";
import { membershipStatusLabel } from "@/lib/connect-group-members";
import { dayName } from "@/types/content";
import type { OwnMembershipWithGroup } from "@/services/connect-group-membership";

const leaveInitial: MembershipActionState = { ok: false, message: "" };

function formatMeetingSummary(m: OwnMembershipWithGroup): string | null {
  const parts: string[] = [];
  if (m.group_meeting_day !== null && m.group_meeting_day !== undefined) {
    parts.push(dayName(m.group_meeting_day));
  }
  if (m.group_meeting_time) {
    const [h, min] = m.group_meeting_time.split(":").map(Number);
    if (!Number.isNaN(h) && !Number.isNaN(min)) {
      const period = h >= 12 ? "PM" : "AM";
      const hour = ((h + 11) % 12) + 1;
      parts.push(`${hour}:${String(min).padStart(2, "0")} ${period}`);
    } else {
      parts.push(m.group_meeting_time.slice(0, 5));
    }
  }
  if (m.group_location_note) parts.push(m.group_location_note);
  return parts.length > 0 ? parts.join(" · ") : null;
}

function LeaveSubmit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="danger" size="sm" isLoading={pending}>
      Leave group
    </Button>
  );
}

function AccountLeaveForm({ membershipId }: { membershipId: string }) {
  const [state, formAction] = useFormState(leaveConnectGroupAction, leaveInitial);

  if (state.ok && state.status === "LEFT") {
    return <Alert tone="success">{state.message}</Alert>;
  }

  return (
    <form
      action={formAction}
      className="mt-2 space-y-2"
      noValidate
      onSubmit={(e) => {
        if (
          !window.confirm(
            "Leave this Connect Group? You can request to join again later if the group is open.",
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="membership_id" value={membershipId} />
      {state.message && !state.ok ? <Alert tone="danger">{state.message}</Alert> : null}
      <LeaveSubmit />
    </form>
  );
}

function MembershipRow({
  m,
  tone,
  children,
}: {
  m: OwnMembershipWithGroup;
  tone: "success" | "warning" | "neutral";
  children?: ReactNode;
}) {
  const meeting = formatMeetingSummary(m);
  return (
    <li className="border-b border-border pb-4 last:border-0 last:pb-0">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
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
          {meeting ? <p className="mt-1 text-xs text-ink-muted">{meeting}</p> : null}
          {children}
        </div>
        <Badge tone={tone}>{m.status}</Badge>
      </div>
    </li>
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
      <div className="space-y-4">
        <p className="text-sm text-ink-muted">
          You have not requested membership in a Connect Group yet. Browse open groups to get
          started — requests are reviewed by the church.
        </p>
        <LinkButton href="/connect">Browse Connect Groups</LinkButton>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 text-sm font-semibold text-brand-900">Active</h3>
        {active.length === 0 ? (
          <p className="text-sm text-ink-muted">No active Connect Group memberships.</p>
        ) : (
          <ul className="space-y-3">
            {active.map((m) => (
              <MembershipRow key={m.id} m={m} tone="success">
                <AccountLeaveForm membershipId={m.id} />
              </MembershipRow>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-brand-900">Pending</h3>
        {pending.length === 0 ? (
          <p className="text-sm text-ink-muted">No pending membership requests.</p>
        ) : (
          <ul className="space-y-3">
            {pending.map((m) => (
              <MembershipRow key={m.id} m={m} tone="warning">
                <p className="mt-1 text-xs text-ink-muted">
                  Awaiting church review. Online withdrawal is not available — contact GGCC if you
                  need to cancel.
                </p>
              </MembershipRow>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-brand-900">History</h3>
        {history.length === 0 ? (
          <p className="text-sm text-ink-muted">
            No previous declined, left, or removed memberships.
          </p>
        ) : (
          <ul className="space-y-3">
            {history.map((m) => (
              <MembershipRow key={m.id} m={m} tone="neutral">
                {m.group_slug && m.group_status === "OPEN" ? (
                  <p className="mt-1 text-xs text-ink-muted">
                    <Link
                      href={`/connect/${m.group_slug}`}
                      className="font-medium text-brand-700 hover:underline"
                    >
                      Request to join again
                    </Link>
                  </p>
                ) : null}
              </MembershipRow>
            ))}
          </ul>
        )}
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
