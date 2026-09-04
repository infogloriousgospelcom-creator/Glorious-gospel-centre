import { describe, expect, it, beforeEach } from "vitest";
import { z } from "zod";

const clientSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
});

describe("env client schema", () => {
  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.NEXT_PUBLIC_SITE_URL;
  });

  it("falls back to localhost when SITE_URL is missing", () => {
    const r = clientSchema.parse({});
    expect(r.NEXT_PUBLIC_SITE_URL).toBe("http://localhost:3000");
  });

  it("accepts a valid Supabase URL", () => {
    const r = clientSchema.parse({
      NEXT_PUBLIC_SUPABASE_URL: "https://abcdefghij.supabase.co",
    });
    expect(r.NEXT_PUBLIC_SUPABASE_URL).toBe("https://abcdefghij.supabase.co");
  });

  it("rejects a malformed Supabase URL", () => {
    expect(() =>
      clientSchema.parse({ NEXT_PUBLIC_SUPABASE_URL: "not-a-url" }),
    ).toThrow();
  });
});