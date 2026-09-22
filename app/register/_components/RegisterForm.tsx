"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { memberSignUpAction, type AuthState } from "@/services/auth.actions";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Form";

const initialState: AuthState = { ok: false, message: "" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" isLoading={pending} className="w-full sm:w-auto">
      Create account
    </Button>
  );
}

export function RegisterForm() {
  const [state, formAction] = useFormState(memberSignUpAction, initialState);

  if (state.ok && state.needsEmailConfirmation) {
    return (
      <div className="space-y-4">
        <Alert tone="success" title="Check your email">
          {state.message}
        </Alert>
        <p className="text-sm text-ink-muted">
          Already confirmed?{" "}
          <Link href="/login" className="font-semibold text-brand-700 hover:text-brand-800">
            Sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <Field label="Full name" htmlFor="register-name" required error={state.errors?.full_name}>
        <Input
          id="register-name"
          name="full_name"
          type="text"
          required
          autoComplete="name"
          maxLength={120}
          aria-invalid={Boolean(state.errors?.full_name)}
        />
      </Field>
      <Field label="Email" htmlFor="register-email" required error={state.errors?.email}>
        <Input
          id="register-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          aria-invalid={Boolean(state.errors?.email)}
        />
      </Field>
      <Field
        label="Password"
        htmlFor="register-password"
        required
        hint="At least 8 characters."
        error={state.errors?.password}
      >
        <Input
          id="register-password"
          name="password"
          type="password"
          required
          minLength={8}
          maxLength={200}
          autoComplete="new-password"
          aria-invalid={Boolean(state.errors?.password)}
        />
      </Field>
      <Field
        label="Confirm password"
        htmlFor="register-confirm"
        required
        error={state.errors?.confirm_password}
      >
        <Input
          id="register-confirm"
          name="confirm_password"
          type="password"
          required
          minLength={8}
          maxLength={200}
          autoComplete="new-password"
          aria-invalid={Boolean(state.errors?.confirm_password)}
        />
      </Field>

      {state.message && !state.ok ? <Alert tone="danger">{state.message}</Alert> : null}

      <div className="flex justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}
