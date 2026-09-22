/**
 * Shared member-notification types and href safety helpers (I-B8).
 * Safe for client + server (no server-only).
 */

export interface MemberNotificationItem {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  href: string | null;
  source_type: string;
  source_id: string | null;
  event_key: string;
  read_at: string | null;
  created_at: string;
}

/** Relative path only — mirrors DB constraint (defense in depth for UI). */
export function isSafeMemberNotificationHref(href: string | null | undefined): boolean {
  if (!href) return false;
  if (href.length < 1 || href.length > 200) return false;
  if (!/^\/[a-zA-Z0-9][a-zA-Z0-9/_-]*$/.test(href)) return false;
  if (href.includes(":") || href.includes("//")) return false;
  if (/^\/admin(\/|$)/i.test(href)) return false;
  return true;
}

export const MEMBER_NOTIFICATION_KINDS = [
  "connect_group.approved",
  "connect_group.declined",
  "connect_group.removed",
] as const;
