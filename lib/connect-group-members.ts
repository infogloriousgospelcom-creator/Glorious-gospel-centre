/**
 * Connect Group membership helpers — Phase I-B2 (schema foundation only).
 * No join/leave workflow UI in this phase.
 */

export const CONNECT_GROUP_MEMBER_STATUSES = [
  "PENDING",
  "ACTIVE",
  "DECLINED",
  "LEFT",
  "REMOVED",
] as const;

export type ConnectGroupMemberStatus = (typeof CONNECT_GROUP_MEMBER_STATUSES)[number];

/** Statuses that occupy a capacity seat. */
export const OCCUPYING_MEMBERSHIP_STATUSES: ConnectGroupMemberStatus[] = [
  "PENDING",
  "ACTIVE",
];

/** Columns safe for authenticated member SELECT (matches migration grants). */
export const MEMBER_MEMBERSHIP_PUBLIC_COLUMNS = [
  "id",
  "connect_group_id",
  "profile_id",
  "status",
  "requested_at",
  "decided_at",
  "left_at",
  "member_note",
  "created_at",
  "updated_at",
] as const;

/** Columns authenticates may INSERT (PENDING self-request only; RLS + trigger). */
export const MEMBER_MEMBERSHIP_INSERT_COLUMNS = [
  "id",
  "connect_group_id",
  "profile_id",
  "status",
  "requested_at",
  "member_note",
] as const;

/** Moderation columns never granted to ordinary member SELECT. */
export const MEMBERSHIP_ADMIN_ONLY_COLUMNS = ["admin_note", "decided_by"] as const;

/** Columns that must not appear on authenticated INSERT grants. */
export const MEMBERSHIP_INSERT_FORBIDDEN_COLUMNS = [
  "admin_note",
  "decided_by",
  "decided_at",
  "left_at",
] as const;

export function isConnectGroupMemberStatus(
  value: string,
): value is ConnectGroupMemberStatus {
  return (CONNECT_GROUP_MEMBER_STATUSES as readonly string[]).includes(value);
}

export function isOccupyingMembershipStatus(status: string): boolean {
  return OCCUPYING_MEMBERSHIP_STATUSES.includes(status as ConnectGroupMemberStatus);
}

/** Member-visible membership row (no admin_note / decided_by). */
export interface ConnectGroupMembershipOwn {
  id: string;
  connect_group_id: string;
  profile_id: string;
  status: ConnectGroupMemberStatus;
  requested_at: string;
  decided_at: string | null;
  left_at: string | null;
  member_note: string | null;
  created_at: string;
  updated_at: string;
}
