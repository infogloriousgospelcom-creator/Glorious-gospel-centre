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
    <Button type="submit" isLoading={pending} className="w-full sm:w-auto">
      Update password
    </Button>
  );
}

export function MemberChangePasswordForm() {
  const [state, formAction] = useFormState(updatePasswordAction, initialState);
  const [show, setShow] = useState(false);
  return (
    <form action={formAction} className="space-y-5" noValidate>
      <input type="hidden" name="audience" value="member" />
      <Field
        label="New password"
        htmlFor="member-new-password"
        required
        hint="At least 8 characters."
        error={state.errors?.password}
      >
        <Input
          id="member-new-password"
          name="password"
          type={show ? "text" : "password"}
          required
          minLength={8}
          maxLength={200}
          autoComplete="new-password"
          aria-invalid={Boolean(state.errors?.password)}
        />
      </Field>
      <Field
        label="Confirm new password"
        htmlFor="member-confirm-password"
        required
        error={state.errors?.confirm_password}
      >
        <Input
          id="member-confirm-password"
          name="confirm_password"
          type={show ? "text" : "password"}
          required
          minLength={8}
          maxLength={200}
          autoComplete="new-password"
          aria-invalid={Boolean(state.errors?.confirm_password)}
        />
      </Field>
      <label className="flex items-center gap-2 text-sm text-ink-muted">
        <input
          type="checkbox"
          checked={show}
          onChange={(e) => setShow(e.target.checked)}
          className="h-4 w-4 rounded border-brand-300 text-brand-700 focus:ring-brand-500"
        />
        Show password
      </label>
      {state.message && !state.ok ? <Alert tone="danger">{state.message}</Alert> : null}
      <div className="flex justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}
