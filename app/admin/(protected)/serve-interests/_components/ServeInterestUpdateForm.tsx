"use client";

import { useFormState, useFormStatus } from "react-dom";
import { updateServeInterestAction } from "@/services/admin/serve-interests";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, Select, Textarea } from "@/components/ui/Form";
import { SERVE_INTEREST_STATUSES } from "@/lib/ministry-serve-interest";
import type { AdminActionState } from "@/services/admin/sermons";

const initial: AdminActionState = { ok: false, message: "" };

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" isLoading={pending} className="min-h-touch">
      Save update
    </Button>
  );
}

export function ServeInterestUpdateForm({
  interestId,
  status,
  staffNote,
}: {
  interestId: string;
  status: string;
  staffNote: string | null;
}) {
  const [state, formAction] = useFormState(updateServeInterestAction, initial);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="interest_id" value={interestId} />
      <Field label="Status" htmlFor="serve-status">
        <Select id="serve-status" name="status" defaultValue={status}>
          {SERVE_INTEREST_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </Field>
      <Field
        label="Staff note (private)"
        htmlFor="serve-staff-note"
        hint="Never shown to the congregant."
      >
        <Textarea
          id="serve-staff-note"
          name="staff_note"
          rows={4}
          maxLength={2000}
          defaultValue={staffNote ?? ""}
        />
      </Field>
      {state.message ? (
        <Alert tone={state.ok ? "success" : "danger"} title={state.ok ? "Updated" : "Could not update"}>
          {state.message}
        </Alert>
      ) : null}
      <SaveButton />
    </form>
  );
}
