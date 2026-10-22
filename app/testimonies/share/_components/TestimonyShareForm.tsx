"use client";

import { useEffect, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  submitTestimony,
  type TestimonySubmitState,
} from "@/services/testimonies";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Form";
import { LinkButton } from "@/components/ui/LinkButton";

const initialState: TestimonySubmitState = { ok: false, message: "" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" isLoading={pending}>
      {pending ? "Sending…" : "Submit story for review"}
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
      <Alert tone="success" title="Story received">
        {message}
      </Alert>
      <div>
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="font-display text-lg font-semibold text-brand-900 outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
        >
          What happens next?
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          A church administrator will review your story. Publication is not guaranteed —
          only approved Stories of Grace appear on the public site.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <LinkButton href="/testimonies">Stories of Grace</LinkButton>
          <LinkButton href="/prayer" variant="secondary">
            Prayer Center
          </LinkButton>
          <LinkButton href="/visit" variant="ghost">
            Plan Your Visit
          </LinkButton>
        </div>
      </div>
    </div>
  );
}

export function TestimonyShareForm() {
  const [state, formAction] = useFormState(submitTestimony, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  if (state.ok) {
    return <SuccessState message={state.message} />;
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-5" noValidate>
      <p className="text-sm text-ink-muted">
        Fields marked with <span aria-hidden="true">*</span>
        <span className="sr-only">asterisk</span> are required. Stories are reviewed before
        publication. Do not include passwords or highly sensitive personal documents.
      </p>

      <div aria-hidden="true" className="hidden">
        <label htmlFor="testimony-website">Website</label>
        <input
          id="testimony-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <Field
        label="Title"
        htmlFor="testimony-title"
        required
        error={state.errors?.title}
        hint="A short headline for your story."
      >
        <Input
          id="testimony-title"
          name="title"
          required
          maxLength={160}
          aria-invalid={Boolean(state.errors?.title)}
        />
      </Field>

      <Field
        label="Your story"
        htmlFor="testimony-story"
        required
        error={state.errors?.story}
        hint="Share how God has been faithful. Keep it personal and respectful."
      >
        <Textarea
          id="testimony-story"
          name="story"
          required
          rows={8}
          maxLength={8000}
          aria-invalid={Boolean(state.errors?.story)}
        />
      </Field>

      <Field
        label="Display name"
        htmlFor="testimony-name"
        error={state.errors?.display_name}
        hint="Shown publicly unless you choose anonymous."
      >
        <Input
          id="testimony-name"
          name="display_name"
          autoComplete="name"
          maxLength={120}
          aria-invalid={Boolean(state.errors?.display_name)}
        />
      </Field>

      <div className="flex items-start gap-3">
        <input
          id="testimony-anonymous"
          name="anonymous"
          type="checkbox"
          className="mt-1 h-4 w-4 rounded border-brand-300 text-brand-700 focus:ring-brand-500"
        />
        <label htmlFor="testimony-anonymous" className="text-sm text-ink">
          Publish anonymously (your name will not appear publicly).
        </label>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Email (optional)"
          htmlFor="testimony-email"
          error={state.errors?.email}
          hint="For the church team only — never shown publicly."
        >
          <Input
            id="testimony-email"
            name="email"
            type="email"
            autoComplete="email"
            aria-invalid={Boolean(state.errors?.email)}
          />
        </Field>
        <Field
          label="Phone (optional)"
          htmlFor="testimony-phone"
          error={state.errors?.phone}
          hint="Optional. For the church team only."
        >
          <Input
            id="testimony-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            aria-invalid={Boolean(state.errors?.phone)}
          />
        </Field>
      </div>

      <div className="space-y-2 rounded-lg border border-border bg-surface-muted p-4">
        <div className="flex items-start gap-3">
          <input
            id="testimony-consent"
            name="consent_to_publish"
            type="checkbox"
            required
            className="mt-1 h-4 w-4 rounded border-brand-300 text-brand-700 focus:ring-brand-500"
            aria-invalid={Boolean(state.errors?.consent_to_publish)}
          />
          <label htmlFor="testimony-consent" className="text-sm text-ink">
            <span className="font-medium text-brand-900">
              I give Glorious Gospel Centre Church permission to review this story and, if
              approved, publish it on the church website.
            </span>{" "}
            <span aria-hidden="true" className="text-ruby-500">
              *
            </span>
            <span className="sr-only"> (required)</span>
          </label>
        </div>
        {state.errors?.consent_to_publish ? (
          <p role="alert" className="text-xs font-medium text-danger-700">
            {state.errors.consent_to_publish}
          </p>
        ) : (
          <p className="text-xs text-ink-muted">
            Consent is required. Publication is not guaranteed — every story is moderated.
          </p>
        )}
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
