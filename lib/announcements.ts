/**
 * Pure announcement active-window helpers (I-B9).
 * Mirrors public query semantics used by getActiveAnnouncements().
 */

export type AnnouncementActiveInput = {
  status?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
};

/**
 * Whether an announcement is active for public display at `now`.
 * Requires PUBLISHED (when status provided), starts_at null or <= now,
 * and ends_at null or > now.
 */
export function isAnnouncementActiveNow(
  row: AnnouncementActiveInput,
  now: Date = new Date(),
): boolean {
  if (row.status != null && row.status !== "PUBLISHED") return false;

  if (row.starts_at) {
    const start = new Date(row.starts_at);
    if (Number.isNaN(start.getTime()) || start.getTime() > now.getTime()) return false;
  }

  if (row.ends_at) {
    const end = new Date(row.ends_at);
    if (Number.isNaN(end.getTime()) || end.getTime() <= now.getTime()) return false;
  }

  return true;
}

export function filterActiveAnnouncements<T extends AnnouncementActiveInput>(
  rows: T[],
  now: Date = new Date(),
): T[] {
  return rows.filter((r) => isAnnouncementActiveNow(r, now));
}

/** Truncate body for compact public cards. */
export function announcementExcerpt(body: string, maxLen = 180): string {
  const trimmed = body.replace(/\s+/g, " ").trim();
  if (trimmed.length <= maxLen) return trimmed;
  return `${trimmed.slice(0, maxLen - 1).trimEnd()}…`;
}
