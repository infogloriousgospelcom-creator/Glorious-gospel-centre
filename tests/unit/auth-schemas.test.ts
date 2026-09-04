import { describe, expect, it } from "vitest";
import { z } from "zod";

// Mirrors LoginSchema from services/auth.actions.ts.
const LoginSchema = z.object({
  email: z.string().trim().email("Enter a valid email.").max(254),
  password: z.string().min(1, "Password is required.").max(200),
  redirect_to: z.string().optional().or(z.literal("")),
});

const UpdatePasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters.").max(200),
    confirm_password: z.string(),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: "Passwords do not match.",
    path: ["confirm_password"],
  });

describe("auth schemas", () => {
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
    it("rejects mismatched confirmation", () => {
      const r = UpdatePasswordSchema.safeParse({
        password: "password1",
        confirm_password: "password2",
      });
      expect(r.success).toBe(false);
    });
    it("rejects too-short password", () => {
      expect(
        UpdatePasswordSchema.safeParse({ password: "short", confirm_password: "short" })
          .success,
      ).toBe(false);
    });
    it("accepts matching passwords of sufficient length", () => {
      expect(
        UpdatePasswordSchema.safeParse({
          password: "longenoughpassword",
          confirm_password: "longenoughpassword",
        }).success,
      ).toBe(true);
    });
  });
});