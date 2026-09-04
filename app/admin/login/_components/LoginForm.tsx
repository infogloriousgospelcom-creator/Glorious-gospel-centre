"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { signInAction, type AuthState } from "@/services/auth.actions";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Form";

const initialState: AuthState = { ok: false, message: "" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" isLoading={pending}>
      Sign in
    </Button>
  );
}

export function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const [state, formAction] = useFormState(signInAction, initialState);
  return (
    <form action={formAction} className="space-y-5" noValidate>
      {redirectTo ? <input type="hidden" name="redirect_to" value={redirectTo} /> : null}
      <Field label="Email" htmlFor="login-email" required error={state.errors?.email}>
        <Input
          id="login-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          aria-invalid={Boolean(state.errors?.email)}
        />
      </Field>
      <Field label="Password" htmlFor="login-password" required error={state.errors?.password}>
        <Input
          id="login-password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          aria-invalid={Boolean(state.errors?.password)}
        />
      </Field>

      {state.message && !state.ok ? <Alert tone="danger">{state.message}</Alert> : null}

      <div className="flex items-center justify-between">
        <Link
          href="/admin/forgot-password"
          className="text-sm font-medium text-brand-700 hover:text-brand-800"
        >
          Forgot your password?
        </Link>
        <SubmitButton />
      </div>
    </form>
  );
}
