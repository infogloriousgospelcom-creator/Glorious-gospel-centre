"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useState } from "react";
import {
  resendMemberEmailVerificationAction,
  updatePasswordAction,
  type AuthState,
} from "@/services/auth.actions";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Form";

const initialState: AuthState = { ok: false, message: "" };

function PasswordSubmit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" isLoading={pending}>
      Update password
    </Button>
  );
}

function ResendSubmit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="secondary" isLoading={pending}>
      Resend verification email
    </Button>
  );
}

function MemberPasswordForm() {
  const [state, formAction] = useFormState(updatePasswordAction, initialState);
  const [show, setShow] = useState(false);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="audience" value="member" />
      <Field
        label="New password"
        htmlFor="hub-new-password"
        required
        hint="At least 8 characters."
        error={state.errors?.password}
      >
        <Input
          id="hub-new-password"
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
        htmlFor="hub-confirm-password"
        required
        error={state.errors?.confirm_password}
      >
        <Input
          id="hub-confirm-password"
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
        <PasswordSubmit />
      </div>
    </form>
  );
}

function ResendVerificationForm() {
  const [state, formAction] = useFormState(resendMemberEmailVerificationAction, initialState);
  return (
    <form action={formAction} className="space-y-3">
      {state.message ? (
        <Alert tone={state.ok ? "success" : "danger"}>{state.message}</Alert>
      ) : null}
      <ResendSubmit />
    </form>
  );
}

export function AccountSecuritySection({
  email,
  emailConfirmed,
}: {
  email: string;
  emailConfirmed: boolean;
}) {
  return (
    <div id="account-security" className="scroll-mt-24 space-y-8">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium text-ink">Email</p>
          <Badge tone={emailConfirmed ? "success" : "warning"}>
            {emailConfirmed ? "Verified" : "Not verified"}
          </Badge>
        </div>
        <p className="text-sm text-ink-muted">
          Signed in as <span className="font-medium text-ink">{email}</span>
        </p>
        {!emailConfirmed ? (
          <div className="space-y-3">
            <Alert tone="warning" title="Verify your email">
              Please confirm your email address. Check your inbox for the confirmation link,
              then return here. Verification is required before joining a Connect Group.
            </Alert>
            <ResendVerificationForm />
          </div>
        ) : (
          <p className="text-sm text-ink-muted">Your email address is verified.</p>
        )}
      </div>

      <div className="space-y-3 border-t border-border pt-6">
        <h3 className="text-sm font-semibold text-brand-900">Change password</h3>
        <p className="text-sm text-ink-muted">
          Choose a new password for this account. You will stay signed in after updating.
        </p>
        <MemberPasswordForm />
      </div>
    </div>
  );
}
