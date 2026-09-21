"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Field, Textarea } from "@/components/ui/Form";
import { batchApproveAction, type BatchApprovalState } from "@/services/admin/approvals.actions";
import type { PendingItem } from "@/services/admin/approvals.read";

const initial: BatchApprovalState = { ok: false, message: "" };

export function ApprovalQueue({ items }: { items: PendingItem[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [note, setNote] = useState<string>("");
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<BatchApprovalState>(initial);

  function toggle(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }
  function toggleAll() {
    setSelected((prev) => {
      if (prev.size === items.length) return new Set();
      return new Set(items.map((it) => `${it.table}:${it.id}`));
    });
  }
  function selectedItems() {
    return items
      .filter((it) => selected.has(`${it.table}:${it.id}`))
      .map((it) => ({ table: it.table, id: it.id }));
  }
  function applyBatch(toStatus: string) {
    const sel = selectedItems();
    if (sel.length === 0) {
      setState({ ok: false, message: "Select at least one item." });
      return;
    }
    const fd = new FormData();
    for (const it of sel) fd.append("items", `${it.table}|${it.id}`);
    fd.set("to_status", toStatus);
    if (note.trim()) fd.set("note", note.trim());
    startTransition(async () => {
      const res = await batchApproveAction(initial, fd);
      setState(res);
      if (res.ok) {
        setSelected(new Set());
        setNote("");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-100 p-4">
        <label className="flex items-center gap-2 text-sm font-medium text-ink">
          <input
            type="checkbox"
            checked={selected.size === items.length && items.length > 0}
            onChange={toggleAll}
            className="h-4 w-4 rounded border-brand-300 text-brand-700 focus:ring-brand-500"
            aria-label="Select all"
          />
          {selected.size > 0 ? `${selected.size} selected` : "Select all"}
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <Field label="" htmlFor="batch-note" >
            <input
              id="batch-note"
              type="text"
              placeholder="Optional shared note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              className="h-9 rounded-xl border border-brand-200 bg-white px-3 text-sm text-ink focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </Field>
          <Button type="button" size="sm" isLoading={pending} onClick={() => applyBatch("APPROVED")}>Approve selected</Button>
          <Button type="button" size="sm" isLoading={pending} onClick={() => applyBatch("PUBLISHED")}>Publish selected</Button>
          <Button type="button" size="sm" variant="secondary" isLoading={pending} onClick={() => applyBatch("REJECTED")}>Reject selected</Button>
        </div>
      </div>

      {state.message ? (
        <div className="px-4">
          <Alert tone={state.ok ? "success" : "danger"} title={state.ok ? "Batch complete" : "Batch error"}>
            {state.message}
            {state.errors && state.errors.length > 0 ? (
              <ul className="mt-1 list-inside list-disc text-xs">
                {state.errors.slice(0, 5).map((e, i) => <li key={i}>{e}</li>)}
                {state.errors.length > 5 ? <li>…and {state.errors.length - 5} more</li> : null}
              </ul>
            ) : null}
          </Alert>
        </div>
      ) : null}

      <ul className="divide-y divide-brand-100">
        {items.map((r) => {
          const key = `${r.table}:${r.id}`;
          const isSelected = selected.has(key);
          return (
            <li
              key={key}
              className={
                "flex flex-wrap items-center justify-between gap-3 px-4 py-3 transition-colors " +
                (isSelected ? "bg-brand-50" : "")
              }
            >
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggle(key)}
                  className="mt-1 h-4 w-4 rounded border-brand-300 text-brand-700 focus:ring-brand-500"
                  aria-label={`Select ${r.title}`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="warning">{r.table}</Badge>
                  </div>
                  <p className="mt-1 truncate text-base font-medium text-ink">{r.title}</p>
                  <p className="text-xs text-ink-muted">Submitted {new Date(r.created_at).toLocaleString()}</p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
void Textarea;
