import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/Section";
import { listApprovalHistory, type ApprovalHistoryRow } from "@/services/admin/approvals.history.read";

export async function ApprovalHistoryPanel({
  entityType,
  entityId,
}: {
  entityType: string;
  entityId: string;
}) {
  const rows = await listApprovalHistory(entityType, entityId, 50);
  return (
    <section className="mt-8">
      <h2 className="heading-3 mb-3">Approval history</h2>
      {rows.length === 0 ? (
        <EmptyState
          title="No history yet"
          description="Status changes for this item will appear here."
        />
      ) : (
        <ol className="relative space-y-3 border-l border-brand-200 pl-5">
          {rows.map((r: ApprovalHistoryRow) => (
            <li key={r.id} className="relative">
              <span className="absolute -left-[7px] mt-1.5 h-3 w-3 rounded-full border-2 border-white bg-brand-500" />
              <div className="flex flex-wrap items-center gap-2 text-sm">
                {r.from_status ? (
                  <>
                    <Badge>{r.from_status}</Badge>
                    <span aria-hidden="true">→</span>
                  </>
                ) : null}
                <Badge tone="brand">{r.to_status}</Badge>
                <span className="text-xs text-ink-muted">{new Date(r.created_at).toLocaleString()}</span>
              </div>
              {r.note ? (
                <p className="mt-1 text-sm text-ink">{r.note}</p>
              ) : null}
              <p className="mt-1 text-xs text-ink-muted">by {r.actor_label?.slice(0, 8) ?? "unknown"}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
