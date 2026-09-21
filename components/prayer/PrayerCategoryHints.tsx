/**
 * Visual guidance only — not stored in the database.
 * Helps visitors think about what to share in their free-text request.
 */
export const PRAYER_CATEGORY_HINTS = [
  "Personal",
  "Family",
  "Health",
  "Work & Provision",
  "Relationships",
  "Spiritual Growth",
  "Thanksgiving",
  "Other",
] as const;

export function PrayerCategoryHints() {
  return (
    <div className="border-t border-border pt-5">
      <p className="eyebrow">Guidance</p>
      <p className="mt-2 text-sm leading-relaxed text-ink-muted">
        You may mention any of these areas in your request. Categories are for personal
        reflection only — they are not stored separately.
      </p>
      <ul className="mt-4 flex flex-wrap gap-2" aria-label="Prayer topic suggestions">
        {PRAYER_CATEGORY_HINTS.map((label) => (
          <li
            key={label}
            className="border border-border px-3 py-1.5 text-xs font-medium text-brand-800"
          >
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
}
