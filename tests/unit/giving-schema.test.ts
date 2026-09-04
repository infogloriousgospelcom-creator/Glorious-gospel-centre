import { describe, expect, it } from "vitest";
import { z } from "zod";

// Mirror of the schema in services/giving.actions.ts.
const SubmitSchema = z.object({
  category_id: z.string().uuid("Select a category."),
  amount: z.coerce
    .number()
    .positive("Amount must be greater than zero.")
    .max(10_000_000, "Amount too large."),
  currency: z.string().trim().min(3).max(8).default("KES"),
  phone: z
    .string()
    .trim()
    .min(7, "Enter a valid phone number.")
    .max(20, "Phone is too long."),
  description: z.string().trim().max(120).optional().or(z.literal("")),
  website: z.string().max(0).optional().or(z.literal("")),
});

describe("giving submit schema", () => {
  const validUuid = "550e8400-e29b-41d4-a716-446655440000";

  it("accepts a valid KES submission", () => {
    const r = SubmitSchema.safeParse({
      category_id: validUuid,
      amount: "1500",
      currency: "KES",
      phone: "+254712345678",
      description: "Tithe",
    });
    expect(r.success).toBe(true);
  });

  it("rejects non-uuid category", () => {
    const r = SubmitSchema.safeParse({
      category_id: "not-a-uuid",
      amount: "1500",
      phone: "+254712345678",
    });
    expect(r.success).toBe(false);
  });

  it("rejects zero amount", () => {
    const r = SubmitSchema.safeParse({
      category_id: validUuid,
      amount: "0",
      phone: "+254712345678",
    });
    expect(r.success).toBe(false);
  });

  it("rejects negative amount", () => {
    const r = SubmitSchema.safeParse({
      category_id: validUuid,
      amount: "-100",
      phone: "+254712345678",
    });
    expect(r.success).toBe(false);
  });

  it("rejects absurdly large amount", () => {
    const r = SubmitSchema.safeParse({
      category_id: validUuid,
      amount: "999999999",
      phone: "+254712345678",
    });
    expect(r.success).toBe(false);
  });

  it("rejects honeypot content", () => {
    const r = SubmitSchema.safeParse({
      category_id: validUuid,
      amount: "100",
      phone: "+254712345678",
      website: "spam",
    });
    expect(r.success).toBe(false);
  });
});