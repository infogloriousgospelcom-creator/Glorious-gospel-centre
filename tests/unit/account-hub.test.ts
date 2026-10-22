import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  computeProfileCompleteness,
  selectAccountNextSteps,
} from "@/lib/account-hub";
import { UpdatePasswordSchema } from "@/lib/auth-schemas";

const authActionsSrc = readFileSync(
  resolve(process.cwd(), "services/auth.actions.ts"),
  "utf8",
);
const accountPageSrc = readFileSync(
  resolve(process.cwd(), "app/account/page.tsx"),
  "utf8",
);
const membershipSectionsSrc = readFileSync(
  resolve(process.cwd(), "app/account/_components/AccountMembershipSections.tsx"),
  "utf8",
);

describe("I-B6 profile completeness", () => {
  it("counts verified email, name, and phone", () => {
    expect(
      computeProfileCompleteness({
        fullName: "Jane",
        phone: "+254700000000",
        emailConfirmed: true,
      }),
    ).toMatchObject({ completed: 3, total: 3, hasName: true, hasPhone: true, emailConfirmed: true });

    expect(
      computeProfileCompleteness({
        fullName: "",
        phone: null,
        emailConfirmed: false,
      }).completed,
    ).toBe(0);

    expect(
      computeProfileCompleteness({
        fullName: "Jane",
        phone: "  ",
        emailConfirmed: true,
      }),
    ).toMatchObject({ completed: 2, hasPhone: false, emailConfirmed: true });
  });
});

describe("I-B6 next-step selector", () => {
  it("prioritizes email verification", () => {
    const r = selectAccountNextSteps({
      emailConfirmed: false,
      memberships: [{ status: "ACTIVE", group_name: "Youth", group_slug: "youth", group_status: "OPEN" }],
    });
    expect(r.title).toMatch(/verify/i);
    expect(r.primary.href).toBe("#account-security");
  });

  it("suggests Connect Groups when verified with no memberships", () => {
    const r = selectAccountNextSteps({ emailConfirmed: true, memberships: [] });
    expect(r.primary.href).toBe("/connect");
    expect(r.primary.label).toMatch(/connect group/i);
    expect(r.secondary.some((a) => a.href === "/visit")).toBe(true);
  });

  it("surfaces PENDING as primary over ACTIVE", () => {
    const r = selectAccountNextSteps({
      emailConfirmed: true,
      memberships: [
        { status: "ACTIVE", group_name: "A", group_slug: "a", group_status: "OPEN" },
        { status: "PENDING", group_name: "B", group_slug: "b", group_status: "OPEN" },
      ],
    });
    expect(r.title).toMatch(/awaiting review/i);
    expect(r.primary.href).toBe("/connect/b");
    expect(r.description).toMatch(/do not need to submit another/i);
  });

  it("opens ACTIVE group when no pending", () => {
    const r = selectAccountNextSteps({
      emailConfirmed: true,
      memberships: [
        { status: "ACTIVE", group_name: "Youth", group_slug: "youth", group_status: "OPEN" },
      ],
    });
    expect(r.primary.href).toBe("/connect/youth");
    expect(r.primary.label).toMatch(/youth/i);
  });

  it("offers re-request for DECLINED/LEFT/REMOVED when OPEN", () => {
    for (const status of ["DECLINED", "LEFT", "REMOVED"] as const) {
      const r = selectAccountNextSteps({
        emailConfirmed: true,
        memberships: [
          { status, group_name: "Home", group_slug: "home", group_status: "OPEN" },
        ],
      });
      expect(r.primary.href).toBe("/connect/home");
      expect(r.primary.label).toMatch(/request to join/i);
    }
  });

  it("does not encourage re-request when group is not OPEN", () => {
    const r = selectAccountNextSteps({
      emailConfirmed: true,
      memberships: [
        { status: "LEFT", group_name: "Home", group_slug: "home", group_status: "CLOSED" },
      ],
    });
    expect(r.primary.href).toBe("/connect");
    expect(r.primary.label).toMatch(/browse|find/i);
  });

  it("avoids contradictory primary CTAs with multiple memberships", () => {
    const r = selectAccountNextSteps({
      emailConfirmed: true,
      memberships: [
        { status: "LEFT", group_name: "Old", group_slug: "old", group_status: "OPEN" },
        { status: "ACTIVE", group_name: "Now", group_slug: "now", group_status: "OPEN" },
      ],
    });
    expect(r.primary.href).toBe("/connect/now");
    expect(r.title).not.toMatch(/request to join again/i);
  });
});

describe("I-B6 auth security actions (static)", () => {
  it("password update requires session and rate limit; no service-role", () => {
    expect(authActionsSrc).toMatch(/updatePasswordAction/);
    expect(authActionsSrc).toMatch(/password-update:/);
    expect(authActionsSrc).toMatch(/auth\.getUser\(\)/);
    expect(authActionsSrc).toMatch(/auth\.updateUser\(\{\s*password/);
    expect(authActionsSrc).not.toMatch(/createServiceRoleClient/);
    expect(UpdatePasswordSchema.safeParse({
      password: "short",
      confirm_password: "short",
      audience: "member",
    }).success).toBe(false);
    expect(UpdatePasswordSchema.safeParse({
      password: "longenough",
      confirm_password: "longenough",
      audience: "member",
    }).success).toBe(true);
  });

  it("resend verification uses session email only", () => {
    expect(authActionsSrc).toMatch(/resendMemberEmailVerificationAction/);
    expect(authActionsSrc).toMatch(/verify-resend:/);
    expect(authActionsSrc).toMatch(/auth\.resend\(/);
    expect(authActionsSrc).toMatch(/type:\s*"signup"/);
    // Must not accept FormData email for identity
    const fn = authActionsSrc.slice(
      authActionsSrc.indexOf("resendMemberEmailVerificationAction"),
      authActionsSrc.indexOf("updateMemberProfileAction"),
    );
    expect(fn).not.toMatch(/formData\.get\(["']email["']\)/);
    expect(fn).toMatch(/user\.email/);
  });

  it("member password redirect stays on /account", () => {
    expect(authActionsSrc).toMatch(/redirect\("\/account\?password=updated"\)/);
  });
});

describe("I-B6 account wiring (static)", () => {
  it("account page composes hub sections", () => {
    expect(accountPageSrc).toMatch(/AccountSecuritySection/);
    expect(accountPageSrc).toMatch(/AccountNextStepsPanel/);
    expect(accountPageSrc).toMatch(/ProfileCompletenessIndicator/);
    expect(accountPageSrc).toMatch(/selectAccountNextSteps/);
    expect(accountPageSrc).toMatch(/requireUser/);
  });

  it("account leave reuses I-B3 leave action", () => {
    expect(membershipSectionsSrc).toMatch(/leaveConnectGroupAction/);
    expect(membershipSectionsSrc).toMatch(/window\.confirm/);
    expect(membershipSectionsSrc).toMatch(/group_status === "OPEN"/);
  });
});
