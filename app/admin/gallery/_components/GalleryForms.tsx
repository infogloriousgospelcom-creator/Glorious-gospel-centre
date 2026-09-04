"use client";
import { useFormState, useFormStatus } from "react-dom";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Form";
import { createAlbum, updateAlbum, addGalleryItem, removeGalleryItem } from "@/services/admin/gallery";
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
export interface AlbumFormInitial {
  id?: string; slug?: string; title?: string; description?: string | null;
  cover_image?: string | null; category?: string | null;
  event_date?: string | null; sort_order?: number; status?: string;
}
export function AlbumForm({ initial: i }: { initial?: AlbumFormInitial }) {
  const action = i?.id ? updateAlbum.bind(null, i.id) : createAlbum;
  const [state, formAction] = useFormState(action, initial);
  return (
    <form action={formAction} className="space-y-5" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Title" htmlFor="ga-title" required error={state.errors?.title}>
          <Input id="ga-title" name="title" required maxLength={200} defaultValue={i?.title ?? ""} />
        </Field>
        <Field label="Slug" htmlFor="ga-slug" required error={state.errors?.slug}>
          <Input id="ga-slug" name="slug" required defaultValue={i?.slug ?? ""} />
        </Field>
        <Field label="Category" htmlFor="ga-cat" error={state.errors?.category}>
          <Input id="ga-cat" name="category" maxLength={80} defaultValue={i?.category ?? ""} />
        </Field>
        <Field label="Event date" htmlFor="ga-date" error={state.errors?.event_date}>
          <Input id="ga-date" name="event_date" type="date" defaultValue={i?.event_date ?? ""} />
        </Field>
        <Field label="Cover image URL" htmlFor="ga-cover" error={state.errors?.cover_image}>
          <Input id="ga-cover" name="cover_image" type="url" defaultValue={i?.cover_image ?? ""} />
        </Field>
        <Field label="Sort order" htmlFor="ga-order" error={state.errors?.sort_order}>
          <Input id="ga-order" name="sort_order" type="number" min={0} defaultValue={i?.sort_order ?? 0} />
        </Field>
        <Field label="Status" htmlFor="ga-status" error={state.errors?.status}>
          <select id="ga-status" name="status" defaultValue={i?.status ?? "DRAFT"} className="h-11 rounded-xl border border-brand-200 bg-white px-3.5 text-sm text-ink focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30">
            {STATUS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Description" htmlFor="ga-desc" error={state.errors?.description}>
        <Textarea id="ga-desc" name="description" rows={4} maxLength={2000} defaultValue={i?.description ?? ""} />
      </Field>
      {state.message && !state.ok ? <Alert tone="danger">{state.message}</Alert> : null}
      <div className="flex justify-end"><Submit label={i?.id ? "Save changes" : "Create album"} /></div>
    </form>
  );
}

export function GalleryItemForm({ albumId }: { albumId: string }) {
  const [state, formAction] = useFormState(addGalleryItem, initial);
  return (
    <form action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="album_id" value={albumId} />
      <Field label="Storage path" htmlFor="gi-path" required hint="Path inside the gallery-images bucket, e.g. 'worship/2025-01/img-01.jpg'." error={state.errors?.storage_path}>
        <Input id="gi-path" name="storage_path" required defaultValue="" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Caption" htmlFor="gi-cap" error={state.errors?.caption}>
          <Input id="gi-cap" name="caption" maxLength={500} />
        </Field>
        <Field label="Alt text" htmlFor="gi-alt" hint="Accessibility — describe the image for screen readers." error={state.errors?.alt_text}>
          <Input id="gi-alt" name="alt_text" maxLength={200} />
        </Field>
        <Field label="Sort order" htmlFor="gi-order" error={state.errors?.sort_order}>
          <Input id="gi-order" name="sort_order" type="number" min={0} defaultValue={0} />
        </Field>
      </div>
      {state.message && !state.ok ? <Alert tone="danger">{state.message}</Alert> : null}
      {state.message && state.ok ? <Alert tone="success">{state.message}</Alert> : null}
      <div className="flex justify-end"><Submit label="Add photo" /></div>
    </form>
  );
}

export function GalleryItemDelete({ itemId, albumId }: { itemId: string; albumId: string }) {
  const [state, formAction] = useFormState(removeGalleryItem.bind(null, itemId, albumId), initial);
  return (
    <form action={formAction} className="inline">
      <button type="submit" className="text-xs font-medium text-danger-700 hover:text-danger-700/80">
        {state.ok ? "Removed" : "Remove"}
      </button>
    </form>
  );
}
