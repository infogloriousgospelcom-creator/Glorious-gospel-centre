"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { deleteConnectGroup } from "@/services/admin/connect-groups";
import type { ConnectGroupAdminRow, ConnectGroupStatus } from "@/types/content";

const TONE: Record<ConnectGroupStatus, "neutral" | "success" | "warning" | "danger" | "info"> = {
  DRAFT: "neutral",
  OPEN: "success",
  FULL: "warning",
  CLOSED: "info",
  ARCHIVED: "danger",
};

export function ConnectGroupRow({ row }: { row: ConnectGroupAdminRow }) {
  const [pending, startTransition] = useTransition();

  return (
    <li className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-display text-base font-semibold text-brand-900">{row.name}</p>
          <Badge tone={TONE[row.status]}>{row.status}</Badge>
        </div>
        <p className="mt-1 text-xs text-ink-muted">
          /connect/{row.slug}
          {row.leader_display_name ? ` · ${row.leader_display_name}` : ""}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link
          href={`/admin/connect-groups/${row.id}`}
          className="inline-flex h-9 items-center rounded-lg border border-border px-3 text-sm font-medium text-brand-800 hover:bg-brand-50"
        >
          Edit
        </Link>
        {row.status === "OPEN" || row.status === "FULL" || row.status === "CLOSED" ? (
          <Link
            href={`/connect/${row.slug}`}
            className="inline-flex h-9 items-center rounded-lg border border-border px-3 text-sm font-medium text-ink-muted hover:bg-surface-muted"
            target="_blank"
            rel="noreferrer"
          >
            View
          </Link>
        ) : null}
        <Button
          type="button"
          size="sm"
          variant="ghost"
          isLoading={pending}
          onClick={() => {
            if (!confirm(`Delete “${row.name}”? This cannot be undone.`)) return;
            startTransition(async () => {
              await deleteConnectGroup(row.id);
            });
          }}
        >
          Delete
        </Button>
      </div>
    </li>
  );
}
