"use client";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { markMessageRead, deleteMessage } from "@/services/admin/messages";

export function MessageRow({ msg }: { msg: { id: string; full_name: string; email: string; phone: string | null; subject: string | null; message: string; is_read: boolean; created_at: string } }) {
  async function toggle() {
    await markMessageRead(msg.id, !msg.is_read);
  }
  async function del() {
    if (!confirm("Delete this message permanently?")) return;
    await deleteMessage(msg.id);
  }
  return (
    <li className="space-y-2 px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={msg.is_read ? "neutral" : "brand"}>{msg.is_read ? "Read" : "Unread"}</Badge>
          {msg.subject ? <Badge tone="accent">{msg.subject}</Badge> : null}
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={toggle}>{msg.is_read ? "Mark unread" : "Mark read"}</Button>
          <Button type="button" variant="ghost" size="sm" onClick={del}>Delete</Button>
        </div>
      </div>
      <p className="text-sm font-medium text-ink">{msg.full_name} <span className="font-normal text-ink-muted">· {msg.email}{msg.phone ? ` · ${msg.phone}` : ""}</span></p>
      <p className="rounded-xl border border-brand-100 bg-surface-muted p-3 text-sm text-ink">{msg.message}</p>
      <p className="text-xs text-ink-muted">{new Date(msg.created_at).toLocaleString()}</p>
    </li>
  );
}
