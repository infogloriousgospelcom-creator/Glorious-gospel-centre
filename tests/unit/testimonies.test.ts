import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  publicDisplayName,
  slugifyTestimonyTitle,
  toPlainText,
  uniqueTestimonySlug,
} from "@/lib/testimonies";

// Mirrors services/testimonies.ts (avoid importing server-only module).
const TESTIMONY_SUBMIT_SCHEMA = z
  .object({
    title: z.string().trim().min(3).max(160),
    story: z.string().trim().min(40).max(8000),
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
      .refine((v) => v === "on", "Publication consent is required to submit your story."),
    website: z.string().max(0).optional().or(z.literal("")),
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

describe("testimony submit schema", () => {
  const valid = {
    title: "God provided",
    story: "In a difficult season the Lord provided exactly what our family needed.",
    display_name: "Jane",
    email: "",
    phone: "",
    consent_to_publish: "on",
    website: "",
  };

  it("accepts a valid named submission with consent", () => {
    expect(TESTIMONY_SUBMIT_SCHEMA.safeParse(valid).success).toBe(true);
  });

  it("accepts anonymous submission without display name", () => {
    const r = TESTIMONY_SUBMIT_SCHEMA.safeParse({
      ...valid,
      display_name: "",
      anonymous: "on",
    });
    expect(r.success).toBe(true);
  });

  it("rejects missing consent", () => {
    const { consent_to_publish: _c, ...rest } = valid;
    const r = TESTIMONY_SUBMIT_SCHEMA.safeParse(rest);
    expect(r.success).toBe(false);
  });

  it("rejects named submission without display name", () => {
    const r = TESTIMONY_SUBMIT_SCHEMA.safeParse({
      ...valid,
      display_name: "",
    });
    expect(r.success).toBe(false);
  });

  it("rejects short story", () => {
    const r = TESTIMONY_SUBMIT_SCHEMA.safeParse({ ...valid, story: "Too short" });
    expect(r.success).toBe(false);
  });

  it("rejects honeypot content", () => {
    const r = TESTIMONY_SUBMIT_SCHEMA.safeParse({ ...valid, website: "http://spam" });
    expect(r.success).toBe(false);
  });
});

describe("testimony plain text / slug helpers", () => {
  it("strips HTML and script tags", () => {
    expect(toPlainText('<script>alert(1)</script>Hello <b>world</b>')).toBe("Hello world");
  });

  it("slugifies titles safely", () => {
    expect(slugifyTestimonyTitle("God's Faithfulness!!!")).toBe("god-s-faithfulness");
  });

  it("creates unique slugs with id suffix", () => {
    const slug = uniqueTestimonySlug("Hello World", "abcdef12-3456-7890-abcd-ef1234567890");
    expect(slug).toBe("hello-world-abcdef12");
  });

  it("hides display name when anonymous", () => {
    expect(
      publicDisplayName({ anonymous: true, display_name: "Secret Name" }),
    ).toBeNull();
    expect(
      publicDisplayName({ anonymous: false, display_name: "Jane" }),
    ).toBe("Jane");
  });
});
