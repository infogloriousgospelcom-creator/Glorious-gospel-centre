"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field, Textarea } from "@/components/ui/Form";
import {
  approveConnectGroupMembership,
  declineConnectGroupMembership,
  removeConnectGroupMembership,
} from "@/services/admin/connect-group-members";
import { membershipStatusLabel } from "@/lib/connect-group-members";
import type { ConnectGroupMembershipAdminRow } from "@/services/admin/connect-group-members.read";
import type { ConnectGroupMemberStatus } from "@/lib/connect-group-members";

const TONE: Record<
  ConnectGroupMemberStatus,
  "warning" | "success" | "danger" | "neutral" | "info"
> = {
  PENDING: "warning",
  ACTIVE: "success",
  DECLINED: "danger",
  LEFT: "neutral",
  REMOVED: "info",
};

export function MembershipRow({ row }: { row: ConnectGroupMembershipAdminRow }) {
  const [status, setStatus] = useState(row.status);
  const [adminNote, setAdminNote] = useState(row.admin_note ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<{ ok: boolean; message: string }>) {
    startTransition(async () => {
      const res = await action();
      setMessage(res.message);
    });
  }

  return (
    <li className="space-y-3 px-5 py-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-display text-base font-semibold text-brand-900">
            {row.member_full_name?.trim() || "Member"}
          </p>
          <Badge tone={TONE[status]}>{membershipStatusLabel(status)}</Badge>
          <span className="text-xs text-ink-muted">{status}</span>
        </div>
        <p className="text-xs text-ink-muted">
          Requested {new Date(row.requested_at).toLocaleString()}
        </p>
      </div>

      {row.member_note ? (
        <p className="text-sm text-ink">
          <span className="font-medium text-brand-900">Member note: </span>
          {row.member_note}
        </p>
      ) : null}

      {row.decided_at ? (
        <p className="text-xs text-ink-muted">
          Decided {new Date(row.decided_at).toLocaleString()}
          {row.decided_by_full_name ? ` · ${row.decided_by_full_name}` : ""}
          {row.left_at ? ` · Left ${new Date(row.left_at).toLocaleString()}` : ""}
        </p>
      ) : null}

      {(status === "PENDING" || status === "ACTIVE") && (
        <Field label="Moderator note (optional)" htmlFor={`mn-${row.id}`}>
          <Textarea
            id={`mn-${row.id}`}
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
            rows={2}
            maxLength={2000}
            placeholder="Internal note — never shown to the member"
          />
        </Field>
      )}

      {status !== "PENDING" && status !== "ACTIVE" && row.admin_note ? (
        <p className="text-sm text-ink-muted">
          <span className="font-medium text-brand-900">Moderator note: </span>
          {row.admin_note}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {status === "PENDING" ? (
          <>
            <Button
              type="button"
              size="sm"
              isLoading={pending}
              onClick={() => {
                if (!confirm("Approve this membership request?")) return;
                run(async () => {
                  const res = await approveConnectGroupMembership(row.id, adminNote);
                  if (res.ok) setStatus("ACTIVE");
                  return res;
                });
              }}
            >
              Approve
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              isLoading={pending}
              onClick={() => {
                if (!confirm("Decline this membership request?")) return;
                run(async () => {
                  const res = await declineConnectGroupMembership(row.id, adminNote);
                  if (res.ok) setStatus("DECLINED");
                  return res;
                });
              }}
            >
              Decline
            </Button>
          </>
        ) : null}

        {status === "ACTIVE" ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            isLoading={pending}
            onClick={() => {
              if (
                !confirm(
                  "Remove this active membership? The history row will be kept as REMOVED.",
                )
              ) {
                return;
              }
              run(async () => {
                const res = await removeConnectGroupMembership(row.id, adminNote);
                if (res.ok) setStatus("REMOVED");
                return res;
              });
            }}
          >
            Remove
          </Button>
        ) : null}
      </div>

      {message ? (
        <p className="text-xs text-ink-muted" role="status" aria-live="polite">
          {message}
        </p>
      ) : null}
    </li>
  );
}
