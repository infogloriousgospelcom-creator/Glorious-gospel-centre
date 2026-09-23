"use client";

import { useFormState, useFormStatus } from "react-dom";
import { submitServeInterestAction, type ServeInterestActionState } from "@/services/ministry-serve-interest.actions";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, Select, Textarea } from "@/components/ui/Form";
import { LinkButton } from "@/components/ui/LinkButton";
import type { OwnServeInterest, ServeInterestOption } from "@/lib/ministry-serve-interest";
import { serveInterestStatusExplanation, serveInterestStatusLabel } from "@/lib/ministry-serve-interest";

const initialState: ServeInterestActionState = { ok: false, message: "" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" isLoading={pending} className="min-h-touch w-full sm:w-auto">
      Submit interest
    </Button>
  );
}

export function ServeInterestForm({
  ministries,
  selectedMinistryId,
  selectedMinistryName,
  loginHref,
  isAuthenticated,
  emailConfirmed,
  existing,
}: {
  ministries: ServeInterestOption[];
  selectedMinistryId?: string | null;
  selectedMinistryName?: string | null;
  loginHref: string;
  isAuthenticated: boolean;
  emailConfirmed: boolean;
  existing: OwnServeInterest | null;
}) {
  const [state, action] = useFormState(submitServeInterestAction, initialState);

  if (!isAuthenticated) {
    return (
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-ink-muted">
          Sign in to tell the church you would like to serve
          {selectedMinistryName ? ` in ${selectedMinistryName}` : ""}. A leader will review
          your interest — this is not an automatic placement.
        </p>
        <div className="flex flex-wrap gap-3">
          <LinkButton href={loginHref}>Sign in to express interest</LinkButton>
          <LinkButton href="/contact" variant="secondary">
            Contact GGCC
          </LinkButton>
        </div>
      </div>
    );
  }

  if (!emailConfirmed) {
    return (
      <div className="space-y-3">
        <Alert tone="warning" title="Verify your email">
          Please verify your email address before expressing interest in serving.
        </Alert>
        <LinkButton href="/account" variant="secondary">
          Go to my account
        </LinkButton>
      </div>
    );
  }

  if (existing && !state.ok) {
    return (
      <div className="space-y-3">
        <Alert tone="info" title={serveInterestStatusLabel(existing.status)}>
          {serveInterestStatusExplanation(existing.status)} You can review this on your account.
        </Alert>
        <LinkButton href="/account#serving-interests" variant="secondary">
          View on my account
        </LinkButton>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5">
      {selectedMinistryId ? (
        <input type="hidden" name="ministry_id" value={selectedMinistryId} />
      ) : (
        <Field
          label="Ministry"
          htmlFor="serve-ministry"
          hint="Choose a ministry, or general serving if you are not sure yet."
          error={state.errors?.ministry_id}
        >
          <Select
            id="serve-ministry"
            name="ministry_id"
            defaultValue=""
            aria-invalid={Boolean(state.errors?.ministry_id)}
          >
            <option value="">General serving interest</option>
            {ministries.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </Select>
        </Field>
      )}

      {selectedMinistryName ? (
        <p className="text-sm text-ink">
          You are expressing interest in{" "}
          <span className="font-semibold text-brand-900">{selectedMinistryName}</span>.
        </p>
      ) : null}

      <Field
        label="A short note (optional)"
        htmlFor="serve-note"
        hint="Share briefly why you would like to serve. You do not need a long application."
        error={state.errors?.member_note}
      >
        <Textarea
          id="serve-note"
          name="member_note"
          rows={3}
          maxLength={500}
          aria-invalid={Boolean(state.errors?.member_note)}
        />
      </Field>

      {state.message ? (
        <Alert
          tone={state.ok ? "success" : state.duplicate ? "info" : "danger"}
          title={state.ok ? "Interest received" : state.duplicate ? "Already submitted" : "Could not submit"}
        >
          {state.message}
        </Alert>
      ) : (
        <p className="text-sm text-ink-muted">
          Church staff will review your interest and follow up. Submitting does not guarantee a
          serving role.
        </p>
      )}

      {!state.ok ? <SubmitButton /> : (
        <LinkButton href="/account#serving-interests" variant="secondary">
          View on my account
        </LinkButton>
      )}
    </form>
  );
}
