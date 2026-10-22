import { z } from "zod";
import { SERVE_INTEREST_STATUSES } from "@/lib/ministry-serve-interest";

export const SubmitServeInterestSchema = z.object({
  ministry_id: z
    .string()
    .uuid("Choose a ministry, or select general serving interest.")
    .optional()
    .or(z.literal("")),
  member_note: z
    .string()
    .trim()
    .max(500, "Please keep your note under 500 characters.")
    .optional()
    .or(z.literal("")),
});

export const UpdateServeInterestSchema = z.object({
  interest_id: z.string().uuid(),
  status: z.enum(SERVE_INTEREST_STATUSES),
  staff_note: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type SubmitServeInterestInput = z.infer<typeof SubmitServeInterestSchema>;
