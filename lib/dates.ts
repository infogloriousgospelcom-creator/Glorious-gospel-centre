export const KENYA_TZ = "Africa/Nairobi";

const dateFmt = new Intl.DateTimeFormat("en-KE", {
  timeZone: KENYA_TZ,
  day: "numeric",
  month: "short",
  year: "numeric",
});

const dateTimeFmt = new Intl.DateTimeFormat("en-KE", {
  timeZone: KENYA_TZ,
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

/**
 * Formats a date for display.
 *
 * Postgres `date` columns hold a calendar date with no time and no zone.
 * Passing "2024-01-15" to `new Date()` yields 2024-01-15T00:00:00Z, which
 * renders as 14 January anywhere west of UTC — so a date-only value is
 * formatted from its string parts and never round-tripped through `Date`.
 */
export function formatKenyaDate(value: string | Date | null | undefined): string {
  if (!value) return "";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split("-");
    return dateFmt.format(new Date(Date.UTC(Number(y), Number(m) - 1, Number(d))));
  }
  return dateFmt.format(new Date(value));
}

/** Formats a timestamp in Nairobi time. */
export function formatKenyaDateTime(value: string | Date | null | undefined): string {
  if (!value) return "";
  return dateTimeFmt.format(new Date(value));
}

/**
 * Formats a date with a custom option set, still pinned to Nairobi time and
 * to an explicit locale so the server and the browser agree.
 */
export function formatKenyaDateWith(
  value: string | Date | null | undefined,
  options: Intl.DateTimeFormatOptions,
): string {
  if (!value) return "";
  const fmt = new Intl.DateTimeFormat("en-KE", { timeZone: KENYA_TZ, ...options });
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split("-");
    return fmt.format(new Date(Date.UTC(Number(y), Number(m) - 1, Number(d))));
  }
  return fmt.format(new Date(value));
}
