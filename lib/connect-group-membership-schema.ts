import { z } from "zod";

export const JoinConnectGroupSchema = z.object({
  connect_group_id: z.string().uuid("Invalid Connect Group."),
  member_note: z
    .string()
    .trim()
    .max(500, "Note is too long.")
    .optional()
    .or(z.literal("")),
});

export const LeaveConnectGroupSchema = z.object({
  membership_id: z.string().uuid("Invalid membership."),
});

export type JoinConnectGroupInput = z.infer<typeof JoinConnectGroupSchema>;
export type LeaveConnectGroupInput = z.infer<typeof LeaveConnectGroupSchema>;

/**
 * Policy for existing rows under unique(connect_group_id, profile_id):
 * - PENDING / ACTIVE: tell the user; do not insert again
 * - DECLINED / LEFT / REMOVED: do not delete history or re-insert;
 *   use the moderated re-request workflow (same row → PENDING)
 */
export function membershipJoinBlockedMessage(status: string): string {
  switch (status) {
    case "PENDING":
      return "Your request to join this group is already pending.";
    case "ACTIVE":
      return "You are already a member of this group.";
    case "DECLINED":
      return "A previous request for this group was declined. You can request to join again from this page if the group is open.";
    case "LEFT":
      return "You previously left this group. You can request to join again from this page if the group is open.";
    case "REMOVED":
      return "Your membership in this group was ended. You can request to join again from this page if the group is open.";
    default:
      return "You already have a membership record for this group.";
  }
}

export const RerequestConnectGroupSchema = z.object({
  membership_id: z.string().uuid("Invalid membership."),
  member_note: z
    .string()
    .trim()
    .max(500, "Note is too long.")
    .optional()
    .or(z.literal("")),
});

export type RerequestConnectGroupInput = z.infer<typeof RerequestConnectGroupSchema>;
