import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { connectGroupAvailabilityLabel } from "@/lib/connect-groups";
import { dayName } from "@/types/content";
import type { ConnectGroupPublic } from "@/types/content";

function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return time.slice(0, 5);
  const period = h >= 12 ? "PM" : "AM";
  const hour = ((h + 11) % 12) + 1;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

export function ConnectGroupCard({ group }: { group: ConnectGroupPublic }) {
  const tone =
    group.status === "OPEN" ? "success" : group.status === "FULL" ? "warning" : "neutral";

  return (
    <li className="border-t border-border pt-5">
      <Link href={`/connect/${group.slug}`} className="group block min-h-touch">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-xl font-semibold text-brand-900 transition-colors group-hover:text-brand-700">
            {group.name}
          </h2>
          <Badge tone={tone}>{connectGroupAvailabilityLabel(group.status)}</Badge>
        </div>
        {group.short_description ? (
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            {group.short_description}
          </p>
        ) : null}
        <p className="mt-3 text-xs text-ink-muted">
          {group.meeting_day !== null && group.meeting_day !== undefined
            ? dayName(group.meeting_day)
            : null}
          {group.meeting_time
            ? `${group.meeting_day !== null ? " · " : ""}${formatTime(group.meeting_time)}`
            : null}
          {group.location_note
            ? `${group.meeting_day !== null || group.meeting_time ? " · " : ""}${group.location_note}`
            : null}
          {group.leader_display_name
            ? `${group.meeting_day !== null || group.meeting_time || group.location_note ? " · " : ""}Led by ${group.leader_display_name}`
            : null}
        </p>
        <span className="mt-4 inline-block text-sm font-semibold text-brand-700">
          Learn more
          <span aria-hidden="true"> →</span>
        </span>
      </Link>
    </li>
  );
}
