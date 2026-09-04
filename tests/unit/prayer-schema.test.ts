import { describe, expect, it } from "vitest";
import { z } from "zod";

const PRAYER_SCHEMA = z.object({
  full_name: z.string().trim().max(120).optional().or(z.literal("")),
  email: z
    .string()
    .trim()
    .max(254)
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Enter a valid email."),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  request_text: z
    .string()
    .trim()
    .min(10, "Please share at least a sentence so we can pray meaningfully.")
    .max(4000, "Please keep your request under 4000 characters."),
  is_confidential: z.literal("on").optional().or(z.literal("")),
  website: z.string().max(0).optional().or(z.literal("")),
});

describe("prayer submit schema", () => {
  it("accepts anonymous prayer (no name / email)", () => {
    const r = PRAYER_SCHEMA.safeParse({
      full_name: "",
      email: "",
      request_text: "Please pray for my family during this hard time.",
    });
    expect(r.success).toBe(true);
  });

  it("requires at least 10 characters of request text", () => {
    const r = PRAYER_SCHEMA.safeParse({
      request_text: "help",
    });
    expect(r.success).toBe(false);
  });

  it("validates optional email format", () => {
    const r = PRAYER_SCHEMA.safeParse({
      email: "not-an-email",
      request_text: "Please pray for wisdom and strength in this season.",
    });
    expect(r.success).toBe(false);
  });

  it("rejects honeypot content", () => {
    const r = PRAYER_SCHEMA.safeParse({
      request_text: "Please pray for me with this long enough body text.",
      website: "spam",
    });
    expect(r.success).toBe(false);
  });
});