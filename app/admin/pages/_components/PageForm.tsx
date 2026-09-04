"use client";
import { useFormState, useFormStatus } from "react-dom";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Form";
import { createPage, updatePage } from "@/services/admin/pages";
import type { AdminActionState } from "@/services/admin/sermons";
const initial: AdminActionState = { ok: false, message: "" };
const STATUS = [
  { value: "DRAFT", label: "Draft" },
  { value: "PENDING_APPROVAL", label: "Pending approval" },
  { value: "APPROVED", label: "Approved" },
  { value: "PUBLISHED", label: "Published" },
  { value: "REJECTED", label: "Rejected" },
  { value: "ARCHIVED", label: "Archived" },
];
function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return <Button type="submit" isLoading={pending}>{label}</Button>;
}
export interface PageFormInitial {
  id?: string; slug?: string; title?: string; excerpt?: string | null;
  body?: string | null; hero_image?: string | null;
  seo_title?: string | null; seo_description?: string | null; seo_og_image?: string | null;
  status?: string;
}
export function PageForm({ initial: i }: { initial?: PageFormInitial }) {
  const action = i?.id ? updatePage.bind(null, i.id) : createPage;
  const [state, formAction] = useFormState(action, initial);
  return (
    <form action={formAction} className="space-y-5" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Title" htmlFor="pg-title" required error={state.errors?.title}>
          <Input id="pg-title" name="title" required maxLength={200} defaultValue={i?.title ?? ""} />
        </Field>
        <Field label="Slug" htmlFor="pg-slug" required error={state.errors?.slug}>
          <Input id="pg-slug" name="slug" required defaultValue={i?.slug ?? ""} />
        </Field>
      </div>
      <Field label="Excerpt" htmlFor="pg-excerpt" error={state.errors?.excerpt}>
        <Textarea id="pg-excerpt" name="excerpt" rows={2} maxLength={500} defaultValue={i?.excerpt ?? ""} />
      </Field>
      <Field label="Body" htmlFor="pg-body" error={state.errors?.body}>
        <Textarea id="pg-body" name="body" rows={16} maxLength={200000} defaultValue={i?.body ?? ""} />
      </Field>
      <Field label="Hero image URL" htmlFor="pg-hero" error={state.errors?.hero_image}>
        <Input id="pg-hero" name="hero_image" type="url" defaultValue={i?.hero_image ?? ""} />
      </Field>
      <details className="rounded-2xl border border-brand-100 bg-surface-muted p-4">
        <summary className="cursor-pointer text-sm font-medium text-ink">SEO settings</summary>
        <div className="mt-4 space-y-4">
          <Field label="SEO title" htmlFor="pg-seo-title" error={state.errors?.seo_title}>
            <Input id="pg-seo-title" name="seo_title" maxLength={200} defaultValue={i?.seo_title ?? ""} />
          </Field>
          <Field label="SEO description" htmlFor="pg-seo-desc" error={state.errors?.seo_description}>
            <Textarea id="pg-seo-desc" name="seo_description" rows={2} maxLength={500} defaultValue={i?.seo_description ?? ""} />
          </Field>
          <Field label="SEO OG image" htmlFor="pg-seo-og" error={state.errors?.seo_og_image}>
            <Input id="pg-seo-og" name="seo_og_image" type="url" defaultValue={i?.seo_og_image ?? ""} />
          </Field>
        </div>
      </details>
      <Field label="Status" htmlFor="pg-status" error={state.errors?.status}>
        <select id="pg-status" name="status" defaultValue={i?.status ?? "DRAFT"} className="h-11 rounded-xl border border-brand-200 bg-white px-3.5 text-sm text-ink focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30">
          {STATUS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </Field>
      {state.message && !state.ok ? <Alert tone="danger">{state.message}</Alert> : null}
      <div className="flex justify-end"><Submit label={i?.id ? "Save changes" : "Create page"} /></div>
    </form>
  );
}
