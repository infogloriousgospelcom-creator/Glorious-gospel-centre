import Link from "next/link";
import { Container, Section } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Section";
import type { AdminLeaderRow } from "@/services/admin/leaders.read";

/**
 * Shared admin list for people in `leaders`. Backs both the Leadership
 * (`/admin/leadership`) and Pastors (`/admin/pastors`) sections so the two
 * stay visually and behaviourally identical.
 */
export function LeaderAdminList({
  rows,
  basePath,
  title,
  newLabel,
  emptyTitle,
  emptyDescription,
  showCategory = false,
}: {
  rows: AdminLeaderRow[];
  /** Section root, e.g. `/admin/leadership` or `/admin/pastors`. */
  basePath: string;
  title: string;
  newLabel: string;
  emptyTitle: string;
  emptyDescription: string;
  /** Render the category badge (used by the all-people Leadership list). */
  showCategory?: boolean;
}) {
  return (
    <Section>
      <Container>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow mb-2">People</p>
            <h1 className="heading-1">{title}</h1>
          </div>
          <Link href={`${basePath}/new`}><Button>{newLabel}</Button></Link>
        </div>
        {rows.length === 0 ? (
          <EmptyState title={emptyTitle} description={emptyDescription} />
        ) : (
          <Card>
            <ul className="divide-y divide-border">
              {rows.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge>{r.status}</Badge>
                      {showCategory ? <Badge tone="accent">{r.category === "PASTOR" ? "Pastor" : "Leadership"}</Badge> : null}
                      {r.is_featured ? <Badge tone="accent">Featured</Badge> : null}
                    </div>
                    <Link href={`${basePath}/${r.id}`} className="mt-1 block text-base font-medium text-brand-900 transition-colors hover:text-brand-700 hover:underline">
                      {r.full_name}
                      {r.title ? <span className="ml-2 text-xs text-ink-muted">· {r.title}</span> : null}
                    </Link>
                  </div>
                  <Link href={`${basePath}/${r.id}`} className="text-sm font-semibold text-brand-700 transition-colors hover:text-brand-800">Edit →</Link>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </Container>
    </Section>
  );
}
