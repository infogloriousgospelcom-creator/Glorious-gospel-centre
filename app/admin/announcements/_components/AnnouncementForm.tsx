"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Form";
import {
  createAnnouncement,
  updateAnnouncement,
} from "@/services/admin/announcements";
import type { AdminActionState } from "@/services/admin/sermons";

const initialState: AdminActionState = { ok: false, message: "" };

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "DRAFT", label: "Draft" },
  { value: "PENDING_APPROVAL", label: "Pending approval" },
  { value: "APPROVED", label: "Approved" },
  { value: "PUBLISHED", label: "Published" },
  { value: "REJECTED", label: "Rejected" },
  { value: "ARCHIVED", label: "Archived" },
];

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" isLoading={pending}>
      {label}
    </Button>
  );
}

export interface AnnouncementFormInitial {
  id?: string;
  title?: string;
  body?: string;
  starts_at?: string | null;
  ends_at?: string | null;
  is_pinned?: boolean;
  status?: string;
}

function toDateTimeLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function AnnouncementForm({ initial }: { initial?: AnnouncementFormInitial }) {
  const action = initial?.id
    ? updateAnnouncement.bind(null, initial.id)
    : createAnnouncement;
  const [state, formAction] = useFormState(action, initialState);

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <Field label="Title" htmlFor="ann-title" required error={state.errors?.title}>
        <Input
          id="ann-title"
          name="title"
          required
          maxLength={200}
          defaultValue={initial?.title ?? ""}
          aria-invalid={Boolean(state.errors?.title)}
        />
      </Field>
      <Field label="Body" htmlFor="ann-body" required error={state.errors?.body}>
        <Textarea
          id="ann-body"
          name="body"
          required
          rows={6}
          maxLength={20000}
          defaultValue={initial?.body ?? ""}
          aria-invalid={Boolean(state.errors?.body)}
        />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Starts at (optional)" htmlFor="ann-starts" error={state.errors?.starts_at}>
          <Input
            id="ann-starts"
            name="starts_at"
            type="datetime-local"
            defaultValue={toDateTimeLocal(initial?.starts_at)}
          />
        </Field>
        <Field label="Ends at (optional)" htmlFor="ann-ends" error={state.errors?.ends_at}>
          <Input
            id="ann-ends"
            name="ends_at"
            type="datetime-local"
            defaultValue={toDateTimeLocal(initial?.ends_at)}
          />
        </Field>
      </div>
      <div className="flex flex-wrap items-end gap-5">
        <Field label="Status" htmlFor="ann-status" error={state.errors?.status}>
          <select
            id="ann-status"
            name="status"
            defaultValue={initial?.status ?? "DRAFT"}
            className="h-11 rounded-xl border border-brand-200 bg-white px-3.5 text-sm text-ink focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </Field>
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            name="is_pinned"
            defaultChecked={Boolean(initial?.is_pinned)}
            className="h-4 w-4 rounded border-brand-300 text-brand-700 focus:ring-brand-500"
          />
          Pin to top
        </label>
      </div>

      {state.message && !state.ok ? <Alert tone="danger">{state.message}</Alert> : null}
      <div className="flex justify-end">
        <SubmitButton label={initial?.id ? "Save changes" : "Create announcement"} />
      </div>
    </form>
  );
}
