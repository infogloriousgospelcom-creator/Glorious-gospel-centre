"use client";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Form";
import { updatePrayerStatus, updatePrayerNotes, deletePrayerRequest } from "@/services/admin/prayer";
const STATUSES = ["NEW", "READ", "RESPONDED", "ARCHIVED"] as const;

export function PrayerRow({ row }: { row: { id: string; full_name: string | null; email: string | null; phone: string | null; request_text: string; status: string; is_confidential: boolean; internal_notes: string | null; created_at: string } }) {
  const [status, setStatus] = useState(row.status);
  const [notes, setNotes] = useState(row.internal_notes ?? "");
  const [savingNotes, setSavingNotes] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  async function onStatusChange(next: string) {
    setStatus(next);
    await updatePrayerStatus(row.id, next);
  }
  async function onSaveNotes() {
    setSavingNotes(true);
    const res = await updatePrayerNotes(row.id, notes);
    setSavingNotes(false);
    if (res.ok) setSavedAt(new Date().toLocaleTimeString());
  }
  async function onDelete() {
    if (!confirm("Permanently delete this prayer request?")) return;
    await deletePrayerRequest(row.id);
  }

  return (
    <li className="space-y-3 px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={row.is_confidential ? "warning" : "neutral"}>
            {row.is_confidential ? "Confidential" : "Public"}
          </Badge>
          <select value={status} onChange={(e) => onStatusChange(e.target.value)} className="h-8 rounded-lg border border-brand-200 bg-white px-2 text-xs text-ink focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30">
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          {savedAt ? <span className="text-xs text-ink-muted">Notes saved {savedAt}</span> : null}
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onDelete}>Delete</Button>
      </div>
      <p className="text-sm font-medium text-ink">{row.full_name ?? "Anonymous"}</p>
      <p className="text-xs text-ink-muted">
        {row.email ?? "—"} · {row.phone ?? "—"} · {new Date(row.created_at).toLocaleString()}
      </p>
      <p className="rounded-xl border border-brand-100 bg-surface-muted p-3 text-sm text-ink">{row.request_text}</p>
      <details className="rounded-xl border border-brand-100 bg-surface p-3">
        <summary className="cursor-pointer text-xs font-medium text-ink-muted">Internal notes (prayer team only)</summary>
        <Textarea
          value={notes}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
          rows={3}
          className="mt-2"
          maxLength={2000}
        />
        <div className="mt-2 flex justify-end">
          <Button type="button" size="sm" isLoading={savingNotes} onClick={onSaveNotes}>Save notes</Button>
        </div>
      </details>
    </li>
  );
}
void Input;
