"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Form";
import { createSeries, updateSeries } from "@/services/admin/series";
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

export interface SeriesFormInitial {
  id?: string;
  slug?: string;
  title?: string;
  description?: string | null;
  hero_image?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  sort_order?: number;
  status?: string;
}

export function SeriesForm({ initial }: { initial?: SeriesFormInitial }) {
  const action = initial?.id ? updateSeries.bind(null, initial.id) : createSeries;
  const [state, formAction] = useFormState(action, initialState);
  return (
    <form action={formAction} className="space-y-5" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Title" htmlFor="sr-title" required error={state.errors?.title}>
          <Input
            id="sr-title"
            name="title"
            required
            maxLength={200}
            defaultValue={initial?.title ?? ""}
            aria-invalid={Boolean(state.errors?.title)}
          />
        </Field>
        <Field
          label="Slug"
          htmlFor="sr-slug"
          required
          error={state.errors?.slug}
        >
          <Input
            id="sr-slug"
            name="slug"
            required
            defaultValue={initial?.slug ?? ""}
            aria-invalid={Boolean(state.errors?.slug)}
          />
        </Field>
      </div>
      <Field label="Description" htmlFor="sr-desc" error={state.errors?.description}>
        <Textarea
          id="sr-desc"
          name="description"
          rows={5}
          maxLength={20000}
          defaultValue={initial?.description ?? ""}
        />
      </Field>
      <Field label="Hero image URL" htmlFor="sr-hero" error={state.errors?.hero_image}>
        <Input
          id="sr-hero"
          name="hero_image"
          type="url"
          defaultValue={initial?.hero_image ?? ""}
        />
      </Field>
      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="Start date" htmlFor="sr-start" error={state.errors?.start_date}>
          <Input
            id="sr-start"
            name="start_date"
            type="date"
            defaultValue={initial?.start_date ?? ""}
          />
        </Field>
        <Field label="End date" htmlFor="sr-end" error={state.errors?.end_date}>
          <Input
            id="sr-end"
            name="end_date"
            type="date"
            defaultValue={initial?.end_date ?? ""}
          />
        </Field>
        <Field label="Sort order" htmlFor="sr-order" error={state.errors?.sort_order}>
          <Input
            id="sr-order"
            name="sort_order"
            type="number"
            min={0}
            defaultValue={initial?.sort_order ?? 0}
          />
        </Field>
      </div>
      <Field label="Status" htmlFor="sr-status" error={state.errors?.status}>
        <select
          id="sr-status"
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
        <SubmitButton label={initial?.id ? "Save changes" : "Create series"} />
      </div>
    </form>
  );
}
