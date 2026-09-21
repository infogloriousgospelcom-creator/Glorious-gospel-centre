"use client";
import { Button } from "@/components/ui/Button";
import { setContentStatus } from "@/services/admin/approvals";
export function ApprovalActions({ table, id }: { table: string; id: string }) {
  async function approve() { await setContentStatus(table, id, "APPROVED"); }
  async function publish() { await setContentStatus(table, id, "PUBLISHED"); }
  async function reject() { await setContentStatus(table, id, "REJECTED"); }
  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" size="sm" onClick={approve}>Approve</Button>
      <Button type="button" size="sm" onClick={publish}>Publish</Button>
      <Button type="button" size="sm" variant="secondary" onClick={reject}>Reject</Button>
    </div>
  );
}
