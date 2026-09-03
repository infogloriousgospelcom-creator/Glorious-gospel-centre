"use client";

import { useEffect, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { submitPrayerRequest, type PrayerSubmitState } from "@/services/prayer";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Form";

const initialState: PrayerSubmitState = { ok: false, message: "" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" isLoading={pending}>
      Send prayer request
    </Button>
  );
}

export function PrayerRequestForm() {
  const [state, formAction] = useFormState(submitPrayerRequest, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
    }
  }, [state.ok]);

  if (state.ok) {
    return (
      <Alert tone="success" title="Prayer request received">
        {state.message}
      </Alert>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-5" noValidate>
      <p className="text-sm text-ink-muted">
        Fields marked with <span aria-hidden="true">*</span> are required.
        All submissions are kept confidential and reviewed only by our prayer
        team.
      </p>

      {/* Honeypot — hidden from real users; bots will fill it. */}
      <div aria-hidden="true" className="hidden">
        <label htmlFor="prayer-website">Website</label>
        <input id="prayer-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Full name" htmlFor="prayer-name" error={state.errors?.full_name}>
          <Input
            id="prayer-name"
            name="full_name"
            autoComplete="name"
            aria-invalid={Boolean(state.errors?.full_name)}
          />
        </Field>
        <Field label="Phone" htmlFor="prayer-phone" error={state.errors?.phone}>
          <Input
            id="prayer-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            aria-invalid={Boolean(state.errors?.phone)}
          />
        </Field>
      </div>
      <Field label="Email" htmlFor="prayer-email" error={state.errors?.email}>
        <Input
          id="prayer-email"
          name="email"
          type="email"
          autoComplete="email"
          aria-invalid={Boolean(state.errors?.email)}
        />
      </Field>
      <Field
        label="Your prayer request"
        htmlFor="prayer-request"
        required
        error={state.errors?.request_text}
        hint="Share as much or as little as you like."
      >
        <Textarea
          id="prayer-request"
          name="request_text"
          required
          rows={6}
          maxLength={4000}
          aria-invalid={Boolean(state.errors?.request_text)}
        />
      </Field>

      <div className="flex items-start gap-3">
        <input
          id="prayer-confidential"
          name="is_confidential"
          type="checkbox"
          defaultChecked
          className="mt-1 h-4 w-4 rounded border-brand-300 text-brand-700 focus:ring-brand-500"
        />
        <label htmlFor="prayer-confidential" className="text-sm text-ink">
          Keep this request confidential (only our prayer team will see it).
        </label>
      </div>

      {state.message && !state.ok ? (
        <Alert tone="danger">{state.message}</Alert>
      ) : null}

      <div className="flex justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}
