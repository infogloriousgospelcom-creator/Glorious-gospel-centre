"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Form";
import { createEvent, updateEvent } from "@/services/admin/events";
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

export interface EventFormInitial {
  id?: string;
  slug?: string;
  title?: string;
  short_description?: string | null;
  description?: string | null;
  poster_url?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  location?: string | null;
  speaker?: string | null;
  registration_required?: boolean;
  status?: string;
}

function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function autoSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export function EventForm({ initial }: { initial?: EventFormInitial }) {
  const action = initial?.id ? updateEvent.bind(null, initial.id) : createEvent;
  const [state, formAction] = useFormState(action, initialState);
  return (
    <form action={formAction} className="space-y-5" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Title" htmlFor="ev-title" required error={state.errors?.title}>
          <Input
            id="ev-title"
            name="title"
            required
            maxLength={200}
            defaultValue={initial?.title ?? ""}
            aria-invalid={Boolean(state.errors?.title)}
          />
        </Field>
        <Field
          label="Slug"
          htmlFor="ev-slug"
          required
          hint="Lowercase letters, numbers, and hyphens."
          error={state.errors?.slug}
        >
          <Input
            id="ev-slug"
            name="slug"
            required
            defaultValue={initial?.slug ?? ""}
            aria-invalid={Boolean(state.errors?.slug)}
            onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
              if (!initial?.id && e.currentTarget.value) {
                e.currentTarget.value = autoSlug(e.currentTarget.value);
              }
            }}
          />
        </Field>
      </div>
      <Field
        label="Short description"
        htmlFor="ev-short"
        hint="Shown on event cards and meta description."
        error={state.errors?.short_description}
      >
        <Textarea
          id="ev-short"
          name="short_description"
          rows={2}
          maxLength={500}
          defaultValue={initial?.short_description ?? ""}
        />
      </Field>
      <Field label="Full description" htmlFor="ev-desc" error={state.errors?.description}>
        <Textarea
          id="ev-desc"
          name="description"
          rows={8}
          maxLength={20000}
          defaultValue={initial?.description ?? ""}
        />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Starts at"
          htmlFor="ev-starts"
          required
          error={state.errors?.starts_at}
        >
          <Input
            id="ev-starts"
            name="starts_at"
            type="datetime-local"
            required
            defaultValue={toLocalInput(initial?.starts_at)}
          />
        </Field>
        <Field label="Ends at (optional)" htmlFor="ev-ends" error={state.errors?.ends_at}>
          <Input
            id="ev-ends"
            name="ends_at"
            type="datetime-local"
            defaultValue={toLocalInput(initial?.ends_at)}
          />
        </Field>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Location" htmlFor="ev-loc" error={state.errors?.location}>
          <Input id="ev-loc" name="location" maxLength={200} defaultValue={initial?.location ?? ""} />
        </Field>
        <Field label="Speaker" htmlFor="ev-spk" error={state.errors?.speaker}>
          <Input id="ev-spk" name="speaker" maxLength={120} defaultValue={initial?.speaker ?? ""} />
        </Field>
      </div>
      <Field label="Poster URL" htmlFor="ev-poster" error={state.errors?.poster_url}>
        <Input
          id="ev-poster"
          name="poster_url"
          type="url"
          defaultValue={initial?.poster_url ?? ""}
        />
      </Field>
      <div className="flex flex-wrap items-end gap-5">
        <Field label="Status" htmlFor="ev-status" error={state.errors?.status}>
          <select
            id="ev-status"
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
            name="registration_required"
            defaultChecked={Boolean(initial?.registration_required)}
            className="h-4 w-4 rounded border-brand-300 text-brand-700 focus:ring-brand-500"
          />
          Registration required
        </label>
      </div>
      {state.message && !state.ok ? <Alert tone="danger">{state.message}</Alert> : null}
      <div className="flex justify-end">
        <SubmitButton label={initial?.id ? "Save changes" : "Create event"} />
      </div>
    </form>
  );
}
