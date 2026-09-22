"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { submitGiving, type GivingState } from "@/services/giving.actions";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Form";
import { usePaymentStatus, type PaymentStatus } from "@/lib/hooks/usePaymentStatus";

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

function PaymentStatusDisplay({ status, transaction, error }: { 
  status: PaymentStatus; 
  transaction: { amountCents: number; currency: string; categoryLabel: string | null; mpesaReceiptNumber?: string | null } | null; 
  error: string | null;
}) {
  const formatKES = (cents: number, currency: string) => 
    new Intl.NumberFormat("en-KE", { style: "currency", currency }).format(cents / 100);

  switch (status) {
    case "PROCESSING":
      return (
        <Alert tone="info" title="Processing your request">
          <p>We are initiating the M-Pesa payment...</p>
        </Alert>
      );
    case "STK_SENT":
      return (
        <Alert tone="info" title="Check your phone">
          <p>An M-Pesa payment request has been sent to your phone.</p>
          <p className="mt-2">Enter your M-Pesa PIN to complete the transaction.</p>
          <p className="mt-2 text-xs text-ink-muted">
            This may take up to 2 minutes. We will update this page automatically.
          </p>
        </Alert>
      );
    case "SUCCESS":
      return (
        <Alert tone="success" title="Thank you!">
          <p>Your giving of {transaction ? formatKES(transaction.amountCents, transaction.currency) : "the specified amount"} has been received successfully.</p>
          {transaction?.mpesaReceiptNumber && (
            <p className="mt-2 text-sm">
              M-Pesa Receipt: <span className="font-mono font-semibold">{transaction.mpesaReceiptNumber}</span>
            </p>
          )}
          {transaction?.categoryLabel && (
            <p className="mt-1 text-sm text-ink-muted">Purpose: {transaction.categoryLabel}</p>
          )}
          <p className="mt-3 text-sm">
            <a href="/account" className="font-medium text-brand-700 hover:underline">
              View your giving history
            </a>
          </p>
        </Alert>
      );
    case "FAILED":
      return (
        <Alert tone="danger" title="Payment failed">
          <p>Your payment could not be completed.</p>
          <p className="mt-2">You can try again by submitting the form below.</p>
        </Alert>
      );
    case "CANCELLED":
      return (
        <Alert tone="warning" title="Payment cancelled">
          <p>The M-Pesa payment was cancelled.</p>
          <p className="mt-2">You can try again by submitting the form below.</p>
        </Alert>
      );
    case "TIMEOUT":
      return (
        <Alert tone="danger" title="Payment timed out">
          <p>{error || "The payment took too long to complete."}</p>
          <p className="mt-2">Your payment has not been completed. You can try again by submitting the form below.</p>
        </Alert>
      );
    default:
      return null;
  }
}

export function GivingForm({ categories }: { categories: CategoryOpt[] }) {
 const [state, formAction] = useFormState(submitGiving, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const defaultId = categories.find((c) => c.is_default)?.id ?? categories[0]?.id ?? "";
  const [showForm, setShowForm] = useState(true);

  const { status, transaction, error, startPolling } = usePaymentStatus({
    transactionId: state.transactionId,
    externalReference: state.externalReference,
    enabled: state.ok && !!state.transactionId,
    intervalMs: 3000,
    maxAttempts: 40,
  });

  useEffect(() => {
    if (state.ok && state.transactionId) {
      formRef.current?.reset();
      setShowForm(false);
      startPolling();
    }
  }, [state.ok, state.transactionId, startPolling]);

  

  if (!showForm && (status === "SUCCESS" || status === "FAILED" || status === "CANCELLED" || status === "TIMEOUT")) {
    return (
      <div>
        <PaymentStatusDisplay 
          status={status} 
          transaction={transaction} 
          error={error}
        />
        <div className="mt-6 flex justify-end">
          <Button onClick={() => setShowForm(true)} variant="secondary">
            Make another gift
          </Button>
        </div>
      </div>
    );
  }

  if (!showForm) {
    return (
      <div>
        <PaymentStatusDisplay 
          status={status} 
          transaction={transaction} 
          error={error}
        />
      </div>
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