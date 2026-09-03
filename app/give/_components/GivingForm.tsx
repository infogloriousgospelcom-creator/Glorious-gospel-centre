"use client";

import { useEffect, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { submitGiving, type GivingState } from "@/services/giving.actions";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Form";

interface CategoryOpt {
  id: string;
  label: string;
  description: string | null;
  is_default?: boolean;
}

const initialState: GivingState = { ok: false, message: "" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" isLoading={pending}>
      Give now
    </Button>
  );
}

export function GivingForm({ categories }: { categories: CategoryOpt[] }) {
  const [state, formAction] = useFormState(submitGiving, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const defaultId = categories.find((c) => c.is_default)?.id ?? categories[0]?.id ?? "";

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  if (state.ok) {
    return (
      <Alert tone="success" title="Thank you">
        {state.message}
        {state.mode === "mock" ? (
          <p className="mt-2 text-xs">
            (Mock mode: configure <code>M_PESA_*</code> env vars for live payments.)
          </p>
        ) : null}
      </Alert>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-5" noValidate>
      <div aria-hidden="true" className="hidden">
        <label htmlFor="giving-website">Website</label>
        <input id="giving-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <Field label="Category" htmlFor="giving-category" required error={state.errors?.category_id}>
        <select
          id="giving-category"
          name="category_id"
          required
          defaultValue={defaultId}
          aria-invalid={Boolean(state.errors?.category_id)}
          className="h-11 w-full rounded-xl border border-brand-200 bg-white px-3.5 text-sm text-ink focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
              {c.description ? ` — ${c.description}` : ""}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Amount (KES)"
          htmlFor="giving-amount"
          required
          hint="Enter the amount in Kenyan Shillings."
          error={state.errors?.amount}
        >
          <Input
            id="giving-amount"
            name="amount"
            type="number"
            min={1}
            step={1}
            required
            inputMode="numeric"
            aria-invalid={Boolean(state.errors?.amount)}
          />
        </Field>
        <Field
          label="Phone (M-Pesa)"
          htmlFor="giving-phone"
          required
          hint="Format: 2547XXXXXXXX or 07XXXXXXXX"
          error={state.errors?.phone}
        >
          <Input
            id="giving-phone"
            name="phone"
            type="tel"
            required
            autoComplete="tel"
            aria-invalid={Boolean(state.errors?.phone)}
          />
        </Field>
      </div>

      <input type="hidden" name="currency" value="KES" />

      <Field label="Note (optional)" htmlFor="giving-note" error={state.errors?.description}>
        <Input id="giving-note" name="description" maxLength={120} />
      </Field>

      {state.message && !state.ok ? <Alert tone="danger">{state.message}</Alert> : null}

      <div className="flex justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}
