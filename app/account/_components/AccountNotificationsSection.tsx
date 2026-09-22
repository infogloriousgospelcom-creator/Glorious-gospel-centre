"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  markMemberNotificationReadAction,
  type MarkNotificationState,
} from "@/services/member-notifications.actions";
import type { MemberNotificationItem } from "@/lib/member-notifications";

const initialMark: MarkNotificationState = { ok: false, message: "" };

function MarkReadSubmit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="ghost" size="sm" disabled={pending}>
      {pending ? "Saving…" : "Mark as read"}
    </Button>
  );
}

function NotificationRow({ item }: { item: MemberNotificationItem }) {
  const unread = !item.read_at;
  const [state, formAction] = useFormState(markMemberNotificationReadAction, initialMark);
  const href = item.href ?? "/account";

  return (
    <li
      className={`flex flex-wrap items-start justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0 ${
        unread ? "bg-brand-50/40 -mx-2 rounded-md px-2 pt-2" : ""
      }`}
    >
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className={`text-sm text-ink ${unread ? "font-semibold" : "font-medium"}`}>
            <Link href={href} className="hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded">
              {item.title}
            </Link>
          </p>
          {unread ? <Badge tone="brand">Unread</Badge> : <Badge tone="neutral">Read</Badge>}
        </div>
        {item.body ? <p className="text-xs text-ink-muted">{item.body}</p> : null}
        <p className="text-xs text-ink-muted">
          {new Date(item.created_at).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
          {" · "}
          <Link href={href} className="font-medium text-brand-700 hover:underline">
            View
          </Link>
        </p>
        {state.message && !state.ok ? (
          <p className="text-xs text-danger-700" role="status">
            {state.message}
          </p>
        ) : null}
      </div>
      {unread ? (
        <form action={formAction}>
          <input type="hidden" name="notification_id" value={item.id} />
          <MarkReadSubmit />
        </form>
      ) : null}
    </li>
  );
}

export function AccountNotificationsSection({
  items,
  loadOk,
}: {
  items: MemberNotificationItem[];
  loadOk: boolean;
}) {
  if (!loadOk) {
    return (
      <Alert tone="danger" title="Unable to load activity">
        We couldn&apos;t load your activity right now. Please try again later.
      </Alert>
    );
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-ink-muted">
        No activity yet. Updates about your Connect Group requests will appear here.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <NotificationRow key={item.id} item={item} />
      ))}
    </ul>
  );
}
