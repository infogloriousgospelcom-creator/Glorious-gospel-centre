import { Badge } from "@/components/ui/Badge";
import { announcementExcerpt } from "@/lib/announcements";
import type { Announcement } from "@/types/content";

/**
 * Compact read-only Church Notices on /account (I-B9).
 * Same public published source as the homepage — not a personal inbox.
 */
export function AccountChurchNotices({ items }: { items: Announcement[] }) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-ink-muted">
        No church notices are active right now. Check back after Sunday for updates.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border">
      {items.map((a) => (
        <li key={a.id} className="py-3 first:pt-0 last:pb-0">
          <div className="flex flex-wrap items-center gap-2">
            {a.is_pinned ? <Badge tone="brand">Pinned</Badge> : null}
            <p className="text-sm font-semibold text-brand-900">{a.title}</p>
          </div>
          <p className="mt-1 text-sm leading-relaxed text-ink-muted">
            {announcementExcerpt(a.body, 160)}
          </p>
        </li>
      ))}
    </ul>
  );
}
