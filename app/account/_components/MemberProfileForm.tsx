"use client";

import { useFormState, useFormStatus } from "react-dom";
import { updateMemberProfileAction, type AuthState } from "@/services/auth.actions";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Form";

const initialState: AuthState = { ok: false, message: "" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" isLoading={pending}>
      Save changes
    </Button>
  );
}

export function MemberProfileForm({
  fullName,
  phone,
}: {
  fullName: string;
  phone: string;
}) {
  const [state, formAction] = useFormState(updateMemberProfileAction, initialState);
  return (
    <form action={formAction} className="space-y-5" noValidate>
      <Field label="Full name" htmlFor="account-full-name" required error={state.errors?.full_name}>
        <Input
          id="account-full-name"
          name="full_name"
          type="text"
          required
          defaultValue={fullName}
          maxLength={120}
          autoComplete="name"
          aria-invalid={Boolean(state.errors?.full_name)}
        />
      </Field>
      <Field
        label="Phone"
        htmlFor="account-phone"
        hint="Optional. Only you and church administrators can see this."
        error={state.errors?.phone}
      >
        <Input
          id="account-phone"
          name="phone"
          type="tel"
          defaultValue={phone}
          maxLength={40}
          autoComplete="tel"
          aria-invalid={Boolean(state.errors?.phone)}
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
