import { describe, expect, it } from "vitest";
import { z } from "zod";

// Mirrors the schema in services/contact.actions.ts.
// Re-declared here to avoid pulling server-only modules.
const SUBMIT_SCHEMA = z.object({
  full_name: z.string().trim().min(2, "Name is required.").max(120, "Name is too long."),
  email: z
    .string()
    .trim()
    .min(1, "Email is required.")
    .max(254, "Email is too long.")
    .refine((v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Enter a valid email."),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  subject: z.string().trim().max(150).optional().or(z.literal("")),
  message: z
    .string()
    .trim()
    .min(10, "Please share at least a sentence so we can help.")
    .max(4000, "Message is too long (max 4000 characters)."),
  website: z.string().max(0).optional().or(z.literal("")),
});

describe("contact submit schema", () => {
  it("accepts a complete submission", () => {
    const r = SUBMIT_SCHEMA.safeParse({
      full_name: "Jane Doe",
      email: "jane@example.com",
      phone: "",
      subject: "Hello",
      message: "I would like to know more about your services.",
      website: "",
    });
    expect(r.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const r = SUBMIT_SCHEMA.safeParse({
      full_name: "Jane",
      email: "not-an-email",
      message: "long enough message here thanks",
    });
    expect(r.success).toBe(false);
  });

  it("rejects too-short message", () => {
    const r = SUBMIT_SCHEMA.safeParse({
      full_name: "Jane",
      email: "jane@example.com",
      message: "short",
    });
    expect(r.success).toBe(false);
  });

  it("rejects too-short name", () => {
    const r = SUBMIT_SCHEMA.safeParse({
      full_name: "J",
      email: "jane@example.com",
      message: "long enough message here thanks",
    });
    expect(r.success).toBe(false);
  });

  it("treats honeypot non-empty as spam", () => {
    const r = SUBMIT_SCHEMA.safeParse({
      full_name: "Spam Bot",
      email: "bot@example.com",
      message: "buy now buy now buy now buy now",
      website: "http://spam.example",
    });
    // The schema rejects honeypot content.
    expect(r.success).toBe(false);
  });
});