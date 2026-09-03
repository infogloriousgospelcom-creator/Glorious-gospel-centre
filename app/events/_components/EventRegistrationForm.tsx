"use client";

import { useFormState, useFormStatus } from "react-dom";
import { registerForEvent, type RegistrationState } from "@/app/events/actions";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Form";

const initialState: RegistrationState = { ok: false, message: "" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" isLoading={pending}>
      Register
    </Button>
  );
}

export function EventRegistrationForm({ eventId }: { eventId: string }) {
  const [state, formAction] = useFormState(registerForEvent, initialState);

  if (state.ok) {
    return (
      <Alert tone="success" title="Registration received">
        {state.message}
      </Alert>
    );
  }

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="event_id" value={eventId} />

      <Field label="Full name" htmlFor="reg-name" required error={state.errors?.full_name}>
        <Input
          id="reg-name"
          name="full_name"
          required
          autoComplete="name"
          aria-invalid={Boolean(state.errors?.full_name)}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Email" htmlFor="reg-email" error={state.errors?.email}>
          <Input
            id="reg-email"
            name="email"
            type="email"
            autoComplete="email"
            aria-invalid={Boolean(state.errors?.email)}
          />
        </Field>
        <Field label="Phone" htmlFor="reg-phone" error={state.errors?.phone}>
          <Input
            id="reg-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            aria-invalid={Boolean(state.errors?.phone)}
          />
        </Field>
      </div>

      <Field label="Notes" htmlFor="reg-notes" error={state.errors?.notes}>
        <Textarea id="reg-notes" name="notes" rows={3} />
      </Field>

      {state.message && !state.ok ? (
        <Alert tone="danger">{state.message}</Alert>
      ) : null}

      <div className="flex justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}
