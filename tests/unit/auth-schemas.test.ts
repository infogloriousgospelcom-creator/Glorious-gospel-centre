import { describe, expect, it } from "vitest";
import { z } from "zod";
import { LoginSchema, UpdatePasswordSchema } from "@/lib/auth-schemas";

// Keeps the legacy suite aligned with shared schemas used by admin forms.

describe("auth schemas (admin shared)", () => {
  describe("login", () => {
    it("accepts a valid login", () => {
      expect(
        LoginSchema.safeParse({
          email: "admin@example.com",
          password: "hunter2hunter2",
        }).success,
      ).toBe(true);
    });
    it("rejects bad email", () => {
      expect(
        LoginSchema.safeParse({ email: "no", password: "hunter2hunter2" }).success,
      ).toBe(false);
    });
    it("requires password", () => {
      expect(
        LoginSchema.safeParse({ email: "admin@example.com", password: "" }).success,
      ).toBe(false);
    });
  });

  describe("update password", () => {
    it("requires matching passwords of sufficient length", () => {
      expect(
        UpdatePasswordSchema.safeParse({
          password: "short",
          confirm_password: "short",
        }).success,
      ).toBe(false);
      expect(
        UpdatePasswordSchema.safeParse({
          password: "longenough",
          confirm_password: "different1",
        }).success,
      ).toBe(false);
      expect(
        UpdatePasswordSchema.safeParse({
          password: "longenough",
          confirm_password: "longenough",
        }).success,
      ).toBe(true);
    });
  });

  // z remains referenced so unused-import lint stays quiet if config is strict elsewhere
  it("zod is available", () => {
    expect(z.string().parse("ok")).toBe("ok");
  });
});
