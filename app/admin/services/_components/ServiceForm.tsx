"use client";
import { useFormState, useFormStatus } from "react-dom";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Form";
import { createService, updateService } from "@/services/admin/services";
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
const DAYS = [
  { value: 0, label: "Sunday" }, { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" }, { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" }, { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];
function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return <Button type="submit" isLoading={pending}>{label}</Button>;
}
export interface ServiceFormInitial {
  id?: string; name?: string; description?: string | null;
  day_of_week?: number; start_time?: string; end_time?: string | null;
  location?: string | null; sort_order?: number; is_recurring?: boolean; status?: string;
}
export function ServiceForm({ initial: i }: { initial?: ServiceFormInitial }) {
  const action = i?.id ? updateService.bind(null, i.id) : createService;
  const [state, formAction] = useFormState(action, initial);
  return (
    <form action={formAction} className="space-y-5" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Name" htmlFor="sv-name" required error={state.errors?.name}>
          <Input id="sv-name" name="name" required maxLength={120} defaultValue={i?.name ?? ""} />
        </Field>
        <Field label="Location" htmlFor="sv-loc" error={state.errors?.location}>
          <Input id="sv-loc" name="location" maxLength={200} defaultValue={i?.location ?? ""} />
        </Field>
        <Field label="Day" htmlFor="sv-day" required error={state.errors?.day_of_week}>
          <select id="sv-day" name="day_of_week" required defaultValue={String(i?.day_of_week ?? 0)} className="h-11 rounded-xl border border-brand-200 bg-white px-3.5 text-sm text-ink focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30">
            {DAYS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
        </Field>
        <Field label="Start time" htmlFor="sv-start" required error={state.errors?.start_time}>
          <Input id="sv-start" name="start_time" type="time" required defaultValue={i?.start_time ?? ""} />
        </Field>
        <Field label="End time" htmlFor="sv-end" error={state.errors?.end_time}>
          <Input id="sv-end" name="end_time" type="time" defaultValue={i?.end_time ?? ""} />
        </Field>
        <Field label="Sort order" htmlFor="sv-order" error={state.errors?.sort_order}>
          <Input id="sv-order" name="sort_order" type="number" min={0} defaultValue={i?.sort_order ?? 0} />
        </Field>
        <Field label="Status" htmlFor="sv-status" error={state.errors?.status}>
          <select id="sv-status" name="status" defaultValue={i?.status ?? "DRAFT"} className="h-11 rounded-xl border border-brand-200 bg-white px-3.5 text-sm text-ink focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30">
            {STATUS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </Field>
        <label className="flex items-center gap-2 self-end pb-2 text-sm text-ink">
          <input type="checkbox" name="is_recurring" defaultChecked={Boolean(i?.is_recurring ?? true)} className="h-4 w-4 rounded border-brand-300 text-brand-700 focus:ring-brand-500" />
          Recurring weekly
        </label>
      </div>
      <Field label="Description" htmlFor="sv-desc" error={state.errors?.description}>
        <Input id="sv-desc" name="description" maxLength={500} defaultValue={i?.description ?? ""} />
      </Field>
      {state.message && !state.ok ? <Alert tone="danger">{state.message}</Alert> : null}
      <div className="flex justify-end"><Submit label={i?.id ? "Save changes" : "Create service"} /></div>
    </form>
  );
}
