import { z } from "zod";

/**
 * Shared Zod schema for Stories of Grace submissions.
 * Safe to import from client tests and server actions.
 */
export const TESTIMONY_SUBMIT_SCHEMA = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, "Please add a short title.")
      .max(160, "Title is too long."),
    story: z
      .string()
      .trim()
      .min(40, "Please share a little more so others can be encouraged.")
      .max(8000, "Please keep your story under 8000 characters."),
    display_name: z.string().trim().max(120).optional().or(z.literal("")),
    anonymous: z.literal("on").optional().or(z.literal("")),
    email: z
      .string()
      .trim()
      .max(254)
      .optional()
      .or(z.literal(""))
      .refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Enter a valid email."),
    phone: z.string().trim().max(40).optional().or(z.literal("")),
    consent_to_publish: z
      .string({ required_error: "Publication consent is required to submit your story." })
      .refine((v) => v === "on", {
        message: "Publication consent is required to submit your story.",
      }),
    website: z.string().max(0, "Spam detected.").optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    const isAnonymous = data.anonymous === "on";
    if (!isAnonymous && !(data.display_name && data.display_name.trim().length >= 2)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["display_name"],
        message: "Add a display name, or choose to publish anonymously.",
      });
    }
  });
