"use client";

import { useFormState, useFormStatus } from "react-dom";
import { requestPasswordResetAction, type AuthState } from "@/services/auth.actions";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Form";

const initialState: AuthState = { ok: false, message: "" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" isLoading={pending}>
      Send reset link
    </Button>
  );
}

export function ForgotPasswordForm() {
  const [state, formAction] = useFormState(requestPasswordResetAction, initialState);
  return (
    <form action={formAction} className="space-y-5" noValidate>
      <Field label="Email" htmlFor="forgot-email" required error={state.errors?.email}>
        <Input
          id="forgot-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          aria-invalid={Boolean(state.errors?.email)}
        />
      </Field>
      {state.message ? (
        <Alert tone={state.ok ? "success" : "danger"}>{state.message}</Alert>
      ) : null}
      <div className="flex justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}
