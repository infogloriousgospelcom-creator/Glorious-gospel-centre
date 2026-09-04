"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Form";
import { createSermon, updateSermon } from "@/services/admin/sermons";
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

export interface SermonFormInitial {
  id?: string;
  slug?: string;
  title?: string;
  description?: string | null;
  speaker?: string | null;
  preached_on?: string;
  scripture?: string | null;
  category?: string | null;
  thumbnail_url?: string | null;
  video_url?: string | null;
  audio_url?: string | null;
  livestream_url?: string | null;
  duration_seconds?: number | null;
  series_id?: string | null;
  status?: string;
}

export interface SeriesOption {
  id: string;
  slug: string;
  title: string;
}

export function SermonForm({
  initial,
  seriesOptions,
}: {
  initial?: SermonFormInitial;
  seriesOptions: SeriesOption[];
}) {
  const action = initial?.id ? updateSermon.bind(null, initial.id) : createSermon;
  const [state, formAction] = useFormState(action, initialState);
  return (
    <form action={formAction} className="space-y-5" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Title" htmlFor="sm-title" required error={state.errors?.title}>
          <Input
            id="sm-title"
            name="title"
            required
            maxLength={200}
            defaultValue={initial?.title ?? ""}
            aria-invalid={Boolean(state.errors?.title)}
          />
        </Field>
        <Field label="Slug" htmlFor="sm-slug" required error={state.errors?.slug}>
          <Input
            id="sm-slug"
            name="slug"
            required
            defaultValue={initial?.slug ?? ""}
            aria-invalid={Boolean(state.errors?.slug)}
          />
        </Field>
      </div>
      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="Speaker" htmlFor="sm-spk" error={state.errors?.speaker}>
          <Input id="sm-spk" name="speaker" maxLength={120} defaultValue={initial?.speaker ?? ""} />
        </Field>
        <Field label="Preached on" htmlFor="sm-date" required error={state.errors?.preached_on}>
          <Input
            id="sm-date"
            name="preached_on"
            type="date"
            required
            defaultValue={initial?.preached_on ?? ""}
          />
        </Field>
        <Field label="Category" htmlFor="sm-cat" error={state.errors?.category}>
          <Input id="sm-cat" name="category" maxLength={80} defaultValue={initial?.category ?? ""} />
        </Field>
      </div>
      <Field label="Scripture" htmlFor="sm-scr" error={state.errors?.scripture}>
        <Input id="sm-scr" name="scripture" maxLength={120} defaultValue={initial?.scripture ?? ""} />
      </Field>
      <Field label="Description / outline" htmlFor="sm-desc" error={state.errors?.description}>
        <Textarea
          id="sm-desc"
          name="description"
          rows={6}
          maxLength={20000}
          defaultValue={initial?.description ?? ""}
        />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Video URL" htmlFor="sm-vid" error={state.errors?.video_url}>
          <Input id="sm-vid" name="video_url" type="url" defaultValue={initial?.video_url ?? ""} />
        </Field>
        <Field label="Audio URL" htmlFor="sm-aud" error={state.errors?.audio_url}>
          <Input id="sm-aud" name="audio_url" type="url" defaultValue={initial?.audio_url ?? ""} />
        </Field>
        <Field label="Livestream URL" htmlFor="sm-live" error={state.errors?.livestream_url}>
          <Input id="sm-live" name="livestream_url" type="url" defaultValue={initial?.livestream_url ?? ""} />
        </Field>
        <Field label="Thumbnail URL" htmlFor="sm-thumb" error={state.errors?.thumbnail_url}>
          <Input id="sm-thumb" name="thumbnail_url" type="url" defaultValue={initial?.thumbnail_url ?? ""} />
        </Field>
        <Field
          label="Duration (seconds)"
          htmlFor="sm-dur"
          error={state.errors?.duration_seconds}
        >
          <Input
            id="sm-dur"
            name="duration_seconds"
            type="number"
            min={0}
            defaultValue={initial?.duration_seconds ?? ""}
          />
        </Field>
        <Field label="Series" htmlFor="sm-series" error={state.errors?.series_id}>
          <select
            id="sm-series"
            name="series_id"
            defaultValue={initial?.series_id ?? ""}
            className="h-11 rounded-xl border border-brand-200 bg-white px-3.5 text-sm text-ink focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          >
            <option value="">None</option>
            {seriesOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Status" htmlFor="sm-status" error={state.errors?.status}>
        <select
          id="sm-status"
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
      {state.message && !state.ok ? <Alert tone="danger">{state.message}</Alert> : null}
      <div className="flex justify-end">
        <SubmitButton label={initial?.id ? "Save changes" : "Create sermon"} />
      </div>
    </form>
  );
}
