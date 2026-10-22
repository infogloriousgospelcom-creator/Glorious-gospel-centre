import { Card } from "@/components/ui/Card";
import { formatGivingAmount } from "@/services/member-giving";
import type { AccountStats } from "@/lib/account-hub";

/**
 * Summary cards for the member dashboard.
 *
 * Presentational and server-rendered — it adds no client JavaScript. Every
 * value comes from `computeAccountStats`, which is derived from data the page
 * has already fetched.
 *
 * Honesty rules encoded here:
 *  - A source that failed to load renders "—" and says so in words. It is
 *    never shown as a zero, because "KES 0" would be a claim about the
 *    member's giving that we cannot actually make.
 *  - The unavailable state is carried by text, not by colour alone.
 */

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Card className="p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">
        {label}
      </p>
      <p className="mt-2 font-display text-2xl font-semibold text-brand-900">{value}</p>
      <p className="mt-1 text-xs text-ink-muted">{hint}</p>
    </Card>
  );
}

function plural(count: number, singular: string, pluralForm: string): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

export function AccountStatCards({ stats }: { stats: AccountStats }) {
  const { giving, groups, updates, serving } = stats;

  const givingValue = giving.ok
    ? formatGivingAmount(giving.totalCents, giving.currency)
    : "—";
  const givingHint = !giving.ok
    ? "History unavailable"
    : giving.gifts === 0
      ? "No gifts yet"
      : giving.pending > 0
        ? `${plural(giving.gifts, "gift", "gifts")} · ${plural(giving.pending, "gift pending", "gifts pending")}`
        : plural(giving.gifts, "gift", "gifts");

  const groupsHint =
    groups.active === 0
      ? "No active group"
      : groups.pending > 0
        ? `${plural(groups.pending, "request pending", "requests pending")}`
        : plural(groups.active, "active group", "active groups");

  const updatesValue = updates.ok ? String(updates.unread) : "—";
  const updatesHint = !updates.ok
    ? "History unavailable"
    : updates.unread === 0
      ? "All caught up"
      : `${plural(updates.total, "update", "updates")} in total`;

  const servingValue = serving.ok ? String(serving.total) : "—";
  const servingHint = !serving.ok
    ? "History unavailable"
    : serving.total === 0
      ? "None requested"
      : serving.accepted > 0
        ? `${plural(serving.accepted, "ministry accepted", "ministries accepted")}`
        : "Awaiting a response";

  return (
    <div>
      <h2 className="sr-only">Your account summary</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total given" value={givingValue} hint={givingHint} />
        <StatCard label="Connect Groups" value={String(groups.active)} hint={groupsHint} />
        <StatCard label="Unread updates" value={updatesValue} hint={updatesHint} />
        <StatCard label="Serving interests" value={servingValue} hint={servingHint} />
      </div>
    </div>
  );
}
