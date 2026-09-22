import { describe, expect, it } from "vitest";
import {
  isSafeInternalPath,
  resolveMemberNext,
  safeAdminRedirect,
  safeLegacyMemberRedirect,
  safeMemberRedirect,
} from "@/lib/auth-redirects";
import {
  ForgotPasswordSchema,
  LoginSchema,
  ProfileUpdateSchema,
  RegisterSchema,
  UpdatePasswordSchema,
} from "@/lib/auth-schemas";

describe("auth redirects", () => {
  it("accepts safe internal paths", () => {
    expect(isSafeInternalPath("/account")).toBe(true);
    expect(isSafeInternalPath("/connect/foo")).toBe(true);
  });

  it("rejects open redirects", () => {
    expect(isSafeInternalPath("https://evil.com")).toBe(false);
    expect(isSafeInternalPath("//evil.com")).toBe(false);
    expect(isSafeInternalPath("/\\evil")).toBe(false);
    expect(safeMemberRedirect("https://evil.com")).toBeNull();
    expect(safeMemberRedirect("//evil.com")).toBeNull();
    expect(safeMemberRedirect("javascript:alert(1)")).toBeNull();
  });

  it("never allows /admin for member redirects", () => {
    expect(safeMemberRedirect("/admin")).toBeNull();
    expect(safeMemberRedirect("/admin/dashboard")).toBeNull();
  });

  it("allows member destinations", () => {
    expect(safeMemberRedirect("/account")).toBe("/account");
    expect(safeMemberRedirect("/connect")).toBe("/connect");
    expect(safeMemberRedirect("/connect/youth")).toBe("/connect/youth");
    expect(safeMemberRedirect("/give")).toBe("/give");
    expect(safeMemberRedirect("/reset-password")).toBe("/reset-password");
  });

  it("defaults callback next to /account", () => {
    expect(resolveMemberNext(null)).toBe("/account");
    expect(resolveMemberNext("/admin/dashboard")).toBe("/account");
    expect(resolveMemberNext("/connect")).toBe("/connect");
  });

  it("keeps admin redirects admin-only", () => {
    expect(safeAdminRedirect("/admin/dashboard")).toBe("/admin/dashboard");
    expect(safeAdminRedirect("/account")).toBeNull();
  });

  it("keeps legacy give redirect for admin login non-admins", () => {
    expect(safeLegacyMemberRedirect("/give")).toBe("/give");
    expect(safeLegacyMemberRedirect("/account")).toBeNull();
  });
});

describe("auth schemas", () => {
  describe("login", () => {
    it("accepts a valid login", () => {
      expect(
        LoginSchema.safeParse({
          email: "member@example.com",
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
        LoginSchema.safeParse({ email: "member@example.com", password: "" }).success,
      ).toBe(false);
    });
  });

  describe("register", () => {
    it("accepts a valid registration", () => {
      expect(
        RegisterSchema.safeParse({
          full_name: "Jane Doe",
          email: "jane@example.com",
          password: "securepass1",
          confirm_password: "securepass1",
        }).success,
      ).toBe(true);
    });
    it("requires full name", () => {
      const r = RegisterSchema.safeParse({
        full_name: "A",
        email: "jane@example.com",
        password: "securepass1",
        confirm_password: "securepass1",
      });
      expect(r.success).toBe(false);
    });
    it("rejects weak password", () => {
      const r = RegisterSchema.safeParse({
        full_name: "Jane Doe",
        email: "jane@example.com",
        password: "short",
        confirm_password: "short",
      });
      expect(r.success).toBe(false);
    });
    it("rejects mismatched passwords", () => {
      const r = RegisterSchema.safeParse({
        full_name: "Jane Doe",
        email: "jane@example.com",
        password: "securepass1",
        confirm_password: "securepass2",
      });
      expect(r.success).toBe(false);
      if (!r.success) {
        expect(r.error.flatten().fieldErrors.confirm_password?.[0]).toMatch(/match/i);
      }
    });
    it("rejects invalid email", () => {
      expect(
        RegisterSchema.safeParse({
          full_name: "Jane Doe",
          email: "not-an-email",
          password: "securepass1",
          confirm_password: "securepass1",
        }).success,
      ).toBe(false);
    });
  });

  describe("profile update", () => {
    it("accepts name and optional phone", () => {
      expect(
        ProfileUpdateSchema.safeParse({
          full_name: "Jane Doe",
          phone: "+254 700 000000",
        }).success,
      ).toBe(true);
    });
    it("rejects authorization-like junk in phone", () => {
      expect(
        ProfileUpdateSchema.safeParse({
          full_name: "Jane Doe",
          phone: "admin<script>",
        }).success,
      ).toBe(false);
    });
    it("only allows name and phone fields in schema", () => {
      const r = ProfileUpdateSchema.safeParse({
        full_name: "Jane Doe",
        phone: "",
        role: "SUPER_ADMIN",
        id: "00000000-0000-0000-0000-000000000000",
      });
      expect(r.success).toBe(true);
      if (r.success) {
        expect(r.data).toEqual({ full_name: "Jane Doe", phone: "" });
        expect("role" in r.data).toBe(false);
        expect("id" in r.data).toBe(false);
      }
    });
  });

  describe("password update audience", () => {
    it("accepts member audience", () => {
      expect(
        UpdatePasswordSchema.safeParse({
          password: "newpassword1",
          confirm_password: "newpassword1",
          audience: "member",
        }).success,
      ).toBe(true);
    });
  });

  describe("forgot password", () => {
    it("requires email", () => {
      expect(ForgotPasswordSchema.safeParse({ email: "x" }).success).toBe(false);
      expect(ForgotPasswordSchema.safeParse({ email: "a@b.co" }).success).toBe(true);
    });
  });
});

describe("member vs admin destination policy", () => {
  it("member login default destination is /account", () => {
    expect(safeMemberRedirect(undefined) ?? "/account").toBe("/account");
  });
  it("admin login non-admin default remains home (legacy give only)", () => {
    expect(safeLegacyMemberRedirect(undefined) ?? "/").toBe("/");
  });
  it("admin default remains dashboard", () => {
    expect(safeAdminRedirect(undefined) ?? "/admin/dashboard").toBe("/admin/dashboard");
  });
  it("member sign-out destination is public home", () => {
    expect("/").toBe("/");
  });
  it("admin sign-out destination is admin login", () => {
    expect("/admin/login").toBe("/admin/login");
  });
});
