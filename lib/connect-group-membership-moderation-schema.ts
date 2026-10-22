import { z } from "zod";

export const ModerateMembershipSchema = z.object({
  membership_id: z.string().uuid("Invalid membership."),
  admin_note: z
    .string()
    .trim()
    .max(2000, "Moderator note is too long.")
    .optional()
    .or(z.literal("")),
});

export type ModerateMembershipInput = z.infer<typeof ModerateMembershipSchema>;

/**
 * Normalize optional admin note for RPC.
 * null/undefined/blank → null (RPC leaves existing admin_note unchanged).
 * Non-empty → trimmed text (RPC stores it; max 2000 enforced by Zod + DB).
 */
export function normalizeAdminNoteForRpc(
  note: string | undefined | null,
): string | null {
  if (note === undefined || note === null) return null;
  const t = note.trim();
  return t.length === 0 ? null : t;
}
