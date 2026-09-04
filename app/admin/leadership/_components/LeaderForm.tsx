"use client";
import { useFormState, useFormStatus } from "react-dom";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Form";
import { createLeader, updateLeader } from "@/services/admin/leaders";
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

export interface LeaderFormInitial {
  id?: string; full_name?: string; title?: string | null; bio?: string | null;
  image_url?: string | null; email?: string | null; phone?: string | null;
  sort_order?: number; is_featured?: boolean; status?: string;
}

export function LeaderForm({ initial: i }: { initial?: LeaderFormInitial }) {
  const action = i?.id ? updateLeader.bind(null, i.id) : createLeader;
  const [state, formAction] = useFormState(action, initial);
  return (
    <form action={formAction} className="space-y-5" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Full name" htmlFor="ld-name" required error={state.errors?.full_name}>
          <Input id="ld-name" name="full_name" required maxLength={120} defaultValue={i?.full_name ?? ""} />
        </Field>
        <Field label="Title" htmlFor="ld-title" error={state.errors?.title}>
          <Input id="ld-title" name="title" maxLength={120} defaultValue={i?.title ?? ""} />
        </Field>
        <Field label="Image URL" htmlFor="ld-img" error={state.errors?.image_url}>
          <Input id="ld-img" name="image_url" type="url" defaultValue={i?.image_url ?? ""} />
        </Field>
        <Field label="Email" htmlFor="ld-email" error={state.errors?.email}>
          <Input id="ld-email" name="email" type="email" defaultValue={i?.email ?? ""} />
        </Field>
        <Field label="Phone" htmlFor="ld-phone" error={state.errors?.phone}>
          <Input id="ld-phone" name="phone" maxLength={40} defaultValue={i?.phone ?? ""} />
        </Field>
        <Field label="Sort order" htmlFor="ld-order" error={state.errors?.sort_order}>
          <Input id="ld-order" name="sort_order" type="number" min={0} defaultValue={i?.sort_order ?? 0} />
        </Field>
        <Field label="Status" htmlFor="ld-status" error={state.errors?.status}>
          <select id="ld-status" name="status" defaultValue={i?.status ?? "DRAFT"} className="h-11 rounded-xl border border-brand-200 bg-white px-3.5 text-sm text-ink focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30">
            {STATUS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </Field>
        <label className="flex items-center gap-2 self-end pb-2 text-sm text-ink">
          <input type="checkbox" name="is_featured" defaultChecked={Boolean(i?.is_featured)} className="h-4 w-4 rounded border-brand-300 text-brand-700 focus:ring-brand-500" />
          Featured on home page
        </label>
      </div>
      <Field label="Bio" htmlFor="ld-bio" error={state.errors?.bio}>
        <Textarea id="ld-bio" name="bio" rows={6} maxLength={20000} defaultValue={i?.bio ?? ""} />
      </Field>
      {state.message && !state.ok ? <Alert tone="danger">{state.message}</Alert> : null}
      <div className="flex justify-end"><Submit label={i?.id ? "Save changes" : "Create leader"} /></div>
    </form>
  );
}
