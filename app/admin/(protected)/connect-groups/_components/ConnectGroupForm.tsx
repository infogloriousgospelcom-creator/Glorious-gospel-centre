"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Form";
import { Select } from "@/components/ui/Select";
import { Alert } from "@/components/ui/Alert";
import {
  createConnectGroup,
  updateConnectGroup,
} from "@/services/admin/connect-groups";
import type { AdminActionState } from "@/services/admin/sermons";
import type { ConnectGroupAdminRow } from "@/types/content";

const initialState: AdminActionState = { ok: false, message: "" };

const DAYS = [
  { value: "", label: "— Not specified —" },
  { value: "0", label: "Sunday" },
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
];

const STATUSES = [
  { value: "DRAFT", label: "Draft (not public)" },
  { value: "OPEN", label: "Open" },
  { value: "FULL", label: "Full" },
  { value: "CLOSED", label: "Closed" },
  { value: "ARCHIVED", label: "Archived (not public)" },
];

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" isLoading={pending}>
      {label}
    </Button>
  );
}

function timeInputValue(value: string | null): string {
  if (!value) return "";
  return value.slice(0, 5);
}

export function ConnectGroupForm({
  initial,
  ministries,
}: {
  initial?: ConnectGroupAdminRow;
  ministries: Array<{ id: string; name: string }>;
}) {
  const action = initial
    ? updateConnectGroup.bind(null, initial.id)
    : createConnectGroup;
  const [state, formAction] = useFormState(action, initialState);

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {state.message ? (
        <Alert tone={state.ok ? "success" : "danger"}>{state.message}</Alert>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Name" htmlFor="cg-name" required>
          <Input
            id="cg-name"
            name="name"
            required
            maxLength={120}
            defaultValue={initial?.name ?? ""}
          />
        </Field>
        <Field label="Slug" htmlFor="cg-slug" hint="Leave blank to auto-generate.">
          <Input
            id="cg-slug"
            name="slug"
            maxLength={120}
            defaultValue={initial?.slug ?? ""}
          />
        </Field>
      </div>

      <Field label="Short description" htmlFor="cg-short">
        <Input
          id="cg-short"
          name="short_description"
          maxLength={280}
          defaultValue={initial?.short_description ?? ""}
        />
      </Field>

      <Field label="Full description" htmlFor="cg-desc">
        <Textarea
          id="cg-desc"
          name="description"
          rows={6}
          maxLength={8000}
          defaultValue={initial?.description ?? ""}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Meeting day" htmlFor="cg-day">
          <Select
            id="cg-day"
            name="meeting_day"
            options={DAYS}
            defaultValue={
              initial?.meeting_day === null || initial?.meeting_day === undefined
                ? ""
                : String(initial.meeting_day)
            }
          />
        </Field>
        <Field label="Meeting time" htmlFor="cg-time" hint="24-hour HH:MM">
          <Input
            id="cg-time"
            name="meeting_time"
            type="time"
            defaultValue={timeInputValue(initial?.meeting_time ?? null)}
          />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Meeting frequency" htmlFor="cg-freq">
          <Input
            id="cg-freq"
            name="meeting_frequency"
            maxLength={120}
            placeholder="e.g. Weekly"
            defaultValue={initial?.meeting_frequency ?? ""}
          />
        </Field>
        <Field label="Location note" htmlFor="cg-loc" hint="Public-safe note only.">
          <Input
            id="cg-loc"
            name="location_note"
            maxLength={280}
            placeholder="e.g. At the church"
            defaultValue={initial?.location_note ?? ""}
          />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Leader display name"
          htmlFor="cg-leader"
          hint="Public label only — not linked to accounts."
        >
          <Input
            id="cg-leader"
            name="leader_display_name"
            maxLength={120}
            defaultValue={initial?.leader_display_name ?? ""}
          />
        </Field>
        <Field label="Capacity (optional)" htmlFor="cg-cap">
          <Input
            id="cg-cap"
            name="capacity"
            type="number"
            min={1}
            defaultValue={initial?.capacity ?? ""}
          />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Related ministry (optional)" htmlFor="cg-ministry">
          <Select
            id="cg-ministry"
            name="ministry_id"
            options={[
              { value: "", label: "— None —" },
              ...ministries.map((m) => ({ value: m.id, label: m.name })),
            ]}
            defaultValue={initial?.ministry_id ?? ""}
          />
        </Field>
        <Field label="Status" htmlFor="cg-status" required>
          <Select
            id="cg-status"
            name="status"
            options={STATUSES}
            defaultValue={initial?.status ?? "DRAFT"}
          />
        </Field>
      </div>

      <Field label="Sort order" htmlFor="cg-sort">
        <Input
          id="cg-sort"
          name="sort_order"
          type="number"
          defaultValue={initial?.sort_order ?? 0}
        />
      </Field>

      <div className="flex justify-end">
        <SubmitButton label={initial ? "Save changes" : "Create group"} />
      </div>
    </form>
  );
}
