"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Form";
import { createMinistry, updateMinistry } from "@/services/admin/ministries";
import type { AdminActionState } from "@/services/admin/sermons";

const initialState: AdminActionState = { ok: false, message: "" };
const STATUS_OPTIONS = [
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

export interface MinistryFormInitial {
  id?: string;
  slug?: string;
  name?: string;
  short_description?: string | null;
  description?: string | null;
  hero_image?: string | null;
  meeting_info?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  sort_order?: number;
  status?: string;
}

export function MinistryForm({ initial }: { initial?: MinistryFormInitial }) {
  const action = initial?.id ? updateMinistry.bind(null, initial.id) : createMinistry;
  const [state, formAction] = useFormState(action, initialState);
  return (
    <form action={formAction} className="space-y-5" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Name" htmlFor="mn-name" required error={state.errors?.name}>
          <Input id="mn-name" name="name" required maxLength={120} defaultValue={initial?.name ?? ""} />
        </Field>
        <Field label="Slug" htmlFor="mn-slug" required error={state.errors?.slug}>
          <Input id="mn-slug" name="slug" required defaultValue={initial?.slug ?? ""} />
        </Field>
      </div>
      <Field label="Short description" htmlFor="mn-short" error={state.errors?.short_description}>
        <Textarea id="mn-short" name="short_description" rows={2} maxLength={500} defaultValue={initial?.short_description ?? ""} />
      </Field>
      <Field label="Full description" htmlFor="mn-desc" error={state.errors?.description}>
        <Textarea id="mn-desc" name="description" rows={6} maxLength={20000} defaultValue={initial?.description ?? ""} />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Hero image URL" htmlFor="mn-hero" error={state.errors?.hero_image}>
          <Input id="mn-hero" name="hero_image" type="url" defaultValue={initial?.hero_image ?? ""} />
        </Field>
        <Field label="Meeting info" htmlFor="mn-meet" error={state.errors?.meeting_info}>
          <Input id="mn-meet" name="meeting_info" maxLength={500} defaultValue={initial?.meeting_info ?? ""} />
        </Field>
        <Field label="Contact email" htmlFor="mn-email" error={state.errors?.contact_email}>
          <Input id="mn-email" name="contact_email" type="email" defaultValue={initial?.contact_email ?? ""} />
        </Field>
        <Field label="Contact phone" htmlFor="mn-phone" error={state.errors?.contact_phone}>
          <Input id="mn-phone" name="contact_phone" maxLength={40} defaultValue={initial?.contact_phone ?? ""} />
        </Field>
        <Field label="Sort order" htmlFor="mn-order" error={state.errors?.sort_order}>
          <Input id="mn-order" name="sort_order" type="number" min={0} defaultValue={initial?.sort_order ?? 0} />
        </Field>
        <Field label="Status" htmlFor="mn-status" error={state.errors?.status}>
          <select id="mn-status" name="status" defaultValue={initial?.status ?? "DRAFT"} className="h-11 rounded-xl border border-brand-200 bg-white px-3.5 text-sm text-ink focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30">
            {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </Field>
      </div>
      {state.message && !state.ok ? <Alert tone="danger">{state.message}</Alert> : null}
      <div className="flex justify-end">
        <SubmitButton label={initial?.id ? "Save changes" : "Create ministry"} />
      </div>
    </form>
  );
}
