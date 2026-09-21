"use client";

import { useEffect, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { submitPrayerRequest, type PrayerSubmitState } from "@/services/prayer";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Form";
import { LinkButton } from "@/components/ui/LinkButton";

const initialState: PrayerSubmitState = { ok: false, message: "" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" isLoading={pending}>
      {pending ? "Sending…" : "Send prayer request"}
    </Button>
  );
}

function SuccessState({ message }: { message: string }) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div className="space-y-6" role="status" aria-live="polite">
      <Alert tone="success" title="Prayer request received">
        {message}
      </Alert>
      <div>
        <h3
          ref={headingRef}
          tabIndex={-1}
          className="font-display text-lg font-semibold text-brand-900 outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
        >
          What happens next?
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          Your request is confidential. Members of our prayer team review submissions and
          commit them to prayer. We do not publish prayer requests on this website.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">
          While you wait on God, you are welcome to keep growing with GGCC.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <LinkButton href="/sermons">Explore Sermons</LinkButton>
          <LinkButton href="/services" variant="secondary">
            Attend a Service
          </LinkButton>
          <LinkButton href="/visit" variant="ghost">
            Plan Your Visit
          </LinkButton>
        </div>
      </div>
    </div>
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
    return <SuccessState message={state.message} />;
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-5" noValidate>
      <p className="text-sm text-ink-muted">
        Fields marked with <span aria-hidden="true">*</span>
        <span className="sr-only">asterisk</span> are required. Submissions are kept
        confidential and reviewed only by authorized members of our prayer team. They are
        never shown publicly on this site.
      </p>

      {/* Honeypot — hidden from real users; bots will fill it. */}
      <div aria-hidden="true" className="hidden">
        <label htmlFor="prayer-website">Website</label>
        <input
          id="prayer-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
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
        hint="Share as much or as little as you like. You may include a topic such as family, health, or thanksgiving."
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

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-ink-muted">
          Optional contact details help us follow up only when appropriate — never for
          public display.
        </p>
        <SubmitButton />
      </div>
    </form>
  );
}
