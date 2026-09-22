"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Form";
import {
  setTestimonyStatus,
  updateTestimonyNotes,
  updateTestimonyContent,
  deleteTestimony,
} from "@/services/admin/testimonies";
import type { TestimonyAdminRow, TestimonyStatus } from "@/types/content";

const STATUS_TONE: Record<TestimonyStatus, "warning" | "success" | "danger" | "neutral"> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "danger",
  ARCHIVED: "neutral",
};

export function TestimonyRow({ row }: { row: TestimonyAdminRow }) {
  const [status, setStatus] = useState<TestimonyStatus>(row.status);
  const [notes, setNotes] = useState(row.internal_notes ?? "");
  const [title, setTitle] = useState(row.title);
  const [story, setStory] = useState(row.story);
  const [displayName, setDisplayName] = useState(row.display_name ?? "");
  const [anonymous, setAnonymous] = useState(row.anonymous);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<{ ok: boolean; message: string }>) {
    startTransition(async () => {
      const res = await action();
      setMessage(res.message);
    });
  }

  return (
    <li className="space-y-4 px-5 py-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={STATUS_TONE[status]}>{status}</Badge>
          {row.anonymous ? <Badge tone="neutral">Anonymous</Badge> : null}
          {row.slug ? (
            <a
              href={`/testimonies/${row.slug}`}
              className="text-xs font-medium text-brand-700 hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              Public page
            </a>
          ) : (
            <span className="text-xs text-ink-muted">No public slug yet</span>
          )}
        </div>
        <p className="text-xs text-ink-muted">
          Submitted {new Date(row.created_at).toLocaleString()}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <p className="text-sm text-ink">
          <span className="font-medium text-brand-900">Public name: </span>
          {row.anonymous ? "Anonymous" : row.display_name ?? "—"}
        </p>
        <p className="text-sm text-ink">
          <span className="font-medium text-brand-900">Contact: </span>
          {row.submitter_email ?? "—"} · {row.submitter_phone ?? "—"}
        </p>
      </div>
      <p className="text-xs text-ink-muted">
        Consent recorded: {row.consent_to_publish ? "yes" : "no"} ·{" "}
        {new Date(row.consent_at).toLocaleString()}
      </p>

      <details className="rounded-xl border border-brand-100 bg-surface p-3" open={status === "PENDING"}>
        <summary className="cursor-pointer text-sm font-medium text-brand-900">
          Review content
        </summary>
        <div className="mt-3 space-y-3">
          <Field label="Title" htmlFor={`t-title-${row.id}`}>
            <Input
              id={`t-title-${row.id}`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={160}
            />
          </Field>
          <Field label="Story" htmlFor={`t-story-${row.id}`}>
            <Textarea
              id={`t-story-${row.id}`}
              value={story}
              onChange={(e) => setStory(e.target.value)}
              rows={6}
              maxLength={8000}
            />
          </Field>
          <Field label="Display name" htmlFor={`t-name-${row.id}`}>
            <Input
              id={`t-name-${row.id}`}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={120}
              disabled={anonymous}
            />
          </Field>
          <div className="flex items-start gap-3">
            <input
              id={`t-anon-${row.id}`}
              type="checkbox"
              checked={anonymous}
              onChange={(e) => setAnonymous(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-brand-300 text-brand-700 focus:ring-brand-500"
            />
            <label htmlFor={`t-anon-${row.id}`} className="text-sm text-ink">
              Publish anonymously
            </label>
          </div>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            isLoading={pending}
            onClick={() =>
              run(() =>
                updateTestimonyContent({
                  id: row.id,
                  title,
                  story,
                  display_name: displayName,
                  anonymous,
                }),
              )
            }
          >
            Save content edits
          </Button>
        </div>
      </details>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          isLoading={pending}
          onClick={() =>
            run(async () => {
              const res = await setTestimonyStatus(row.id, "APPROVED");
              if (res.ok) setStatus("APPROVED");
              return res;
            })
          }
        >
          Approve
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          isLoading={pending}
          onClick={() =>
            run(async () => {
              const res = await setTestimonyStatus(row.id, "REJECTED");
              if (res.ok) setStatus("REJECTED");
              return res;
            })
          }
        >
          Reject
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          isLoading={pending}
          onClick={() =>
            run(async () => {
              const res = await setTestimonyStatus(row.id, "ARCHIVED");
              if (res.ok) setStatus("ARCHIVED");
              return res;
            })
          }
        >
          Archive
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          isLoading={pending}
          onClick={() => {
            if (!confirm("Permanently delete this testimony?")) return;
            run(() => deleteTestimony(row.id));
          }}
        >
          Delete
        </Button>
      </div>

      <details className="rounded-xl border border-brand-100 bg-surface p-3">
        <summary className="cursor-pointer text-xs font-medium text-ink-muted">
          Internal notes (moderators only)
        </summary>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="mt-2"
          maxLength={2000}
        />
        <div className="mt-2 flex justify-end">
          <Button
            type="button"
            size="sm"
            isLoading={pending}
            onClick={() => run(() => updateTestimonyNotes(row.id, notes))}
          >
            Save notes
          </Button>
        </div>
      </details>

      {message ? (
        <p className="text-xs text-ink-muted" role="status" aria-live="polite">
          {message}
        </p>
      ) : null}
    </li>
  );
}
