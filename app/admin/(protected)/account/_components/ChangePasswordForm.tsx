"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useState } from "react";
import { updatePasswordAction, type AuthState } from "@/services/auth.actions";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Form";

const initialState: AuthState = { ok: false, message: "" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" isLoading={pending}>
      Update password
    </Button>
  );
}

export function ChangePasswordForm() {
  const [state, formAction] = useFormState(updatePasswordAction, initialState);
  const [showHint, setShowHint] = useState(false);
  return (
    <form action={formAction} className="space-y-5" noValidate>
      <Field
        label="New password"
        htmlFor="account-password"
        required
        hint="At least 8 characters."
        error={state.errors?.password}
      >
        <Input
          id="account-password"
          name="password"
          type={showHint ? "text" : "password"}
          required
          minLength={8}
          maxLength={200}
          autoComplete="new-password"
          aria-invalid={Boolean(state.errors?.password)}
        />
      </Field>
      <Field
        label="Confirm new password"
        htmlFor="account-confirm"
        required
        error={state.errors?.confirm_password}
      >
        <Input
          id="account-confirm"
          name="confirm_password"
          type={showHint ? "text" : "password"}
          required
          minLength={8}
          maxLength={200}
          autoComplete="new-password"
          aria-invalid={Boolean(state.errors?.confirm_password)}
        />
      </Field>
      <div>
        <label className="flex items-center gap-2 text-sm text-ink-muted">
          <input
            type="checkbox"
            checked={showHint}
            onChange={(e) => setShowHint(e.target.checked)}
            className="h-4 w-4 rounded border-brand-300 text-brand-700 focus:ring-brand-500"
          />
          Show password
        </label>
      </div>
      {state.message && !state.ok ? <Alert tone="danger">{state.message}</Alert> : null}
      <div className="flex justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}
