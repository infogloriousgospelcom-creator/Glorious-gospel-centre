"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { memberSignInAction, type AuthState } from "@/services/auth.actions";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Form";

const initialState: AuthState = { ok: false, message: "" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" isLoading={pending} className="w-full sm:w-auto">
      Sign in
    </Button>
  );
}

export function MemberLoginForm({
  redirectTo,
  authError,
}: {
  redirectTo?: string;
  authError?: string | null;
}) {
  const [state, formAction] = useFormState(memberSignInAction, initialState);
  return (
    <form action={formAction} className="space-y-5" noValidate>
      {redirectTo ? <input type="hidden" name="redirect_to" value={redirectTo} /> : null}
      <Field label="Email" htmlFor="member-login-email" required error={state.errors?.email}>
        <Input
          id="member-login-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          aria-invalid={Boolean(state.errors?.email)}
        />
      </Field>
      <Field
        label="Password"
        htmlFor="member-login-password"
        required
        error={state.errors?.password}
      >
        <Input
          id="member-login-password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          aria-invalid={Boolean(state.errors?.password)}
        />
      </Field>

      {authError ? (
        <Alert tone="danger">
          That confirmation or recovery link is invalid or expired. Please try again.
        </Alert>
      ) : null}
      {state.message && !state.ok ? <Alert tone="danger">{state.message}</Alert> : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/forgot-password"
          className="text-sm font-medium text-brand-700 hover:text-brand-800"
        >
          Forgot your password?
        </Link>
        <SubmitButton />
      </div>
    </form>
  );
}
