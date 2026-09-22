"use client";

import { useFormState, useFormStatus } from "react-dom";
import { memberRequestPasswordResetAction, type AuthState } from "@/services/auth.actions";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Form";

const initialState: AuthState = { ok: false, message: "" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" isLoading={pending} className="w-full sm:w-auto">
      Send reset link
    </Button>
  );
}

export function MemberForgotPasswordForm() {
  const [state, formAction] = useFormState(memberRequestPasswordResetAction, initialState);
  return (
    <form action={formAction} className="space-y-5" noValidate>
      <Field label="Email" htmlFor="member-forgot-email" required error={state.errors?.email}>
        <Input
          id="member-forgot-email"
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
