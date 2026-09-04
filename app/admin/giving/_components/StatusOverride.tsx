"use client";
import { useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, Textarea } from "@/components/ui/Form";
import { overrideTransactionStatus } from "@/services/admin/giving.actions";

const STATUSES = [
  { value: "PENDING", label: "Pending" },
  { value: "PROCESSING", label: "Processing" },
  { value: "SUCCESS", label: "Success" },
  { value: "FAILED", label: "Failed" },
  { value: "CANCELLED", label: "Cancelled" },
] as const;

export function StatusOverride({
  id,
  currentStatus,
}: {
  id: string;
  currentStatus: string;
}) {
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<string>(currentStatus);
  const [reason, setReason] = useState<string>("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit() {
    if (!reason.trim()) {
      setMessage({ ok: false, text: "A reason is required." });
      return;
    }
    setPending(true);
    const res = await overrideTransactionStatus(id, status, reason);
    setPending(false);
    if (res.ok) {
      setMessage({ ok: true, text: "Status updated and audit-logged." });
      setReason("");
    } else {
      setMessage({ ok: false, text: res.message });
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-muted">
        Manual override. Each change is written to <code>audit_logs</code> with the
        reason you provide below.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="New status" htmlFor="go-status">
          <select
            id="go-status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-11 rounded-xl border border-brand-200 bg-white px-3.5 text-sm text-ink focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Reason" htmlFor="go-reason" required hint="Logged in audit_logs; visible to other admins.">
          <Textarea
            id="go-reason"
            value={reason}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReason(e.target.value)}
            rows={3}
            maxLength={500}
            required
          />
        </Field>
      </div>
      {message ? <Alert tone={message.ok ? "success" : "danger"}>{message.text}</Alert> : null}
      <div className="flex justify-end">
        <Button type="button" isLoading={pending} onClick={submit} disabled={status === currentStatus}>
          Override status
        </Button>
      </div>
    </div>
  );
}
