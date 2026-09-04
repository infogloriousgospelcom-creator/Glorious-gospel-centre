"use client";

import { useEffect, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { submitContactMessage, type ContactState } from "@/services/contact.actions";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Form";

const initialState: ContactState = { ok: false, message: "" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" isLoading={pending}>
      Send message
    </Button>
  );
}

export function ContactForm() {
  const [state, formAction] = useFormState(submitContactMessage, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  if (state.ok) {
    return (
      <Alert tone="success" title="Message sent">
        {state.message}
      </Alert>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-5" noValidate>
      <p className="text-sm text-ink-muted">
        Fields marked with <span aria-hidden="true">*</span> are required.
      </p>

      <div aria-hidden="true" className="hidden">
        <label htmlFor="contact-website">Website</label>
        <input id="contact-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Full name" htmlFor="contact-name" required error={state.errors?.full_name}>
          <Input
            id="contact-name"
            name="full_name"
            required
            autoComplete="name"
            aria-invalid={Boolean(state.errors?.full_name)}
          />
        </Field>
        <Field label="Email" htmlFor="contact-email" required error={state.errors?.email}>
          <Input
            id="contact-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            aria-invalid={Boolean(state.errors?.email)}
          />
        </Field>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Phone (optional)" htmlFor="contact-phone" error={state.errors?.phone}>
          <Input
            id="contact-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            aria-invalid={Boolean(state.errors?.phone)}
          />
        </Field>
        <Field label="Subject (optional)" htmlFor="contact-subject" error={state.errors?.subject}>
          <Input
            id="contact-subject"
            name="subject"
            maxLength={150}
            aria-invalid={Boolean(state.errors?.subject)}
          />
        </Field>
      </div>
      <Field label="Message" htmlFor="contact-message" required error={state.errors?.message}>
        <Textarea
          id="contact-message"
          name="message"
          required
          rows={6}
          maxLength={4000}
          aria-invalid={Boolean(state.errors?.message)}
        />
      </Field>

      {state.message && !state.ok ? <Alert tone="danger">{state.message}</Alert> : null}

      <div className="flex justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}
