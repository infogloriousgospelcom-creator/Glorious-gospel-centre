import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const accountPageSrc = readFileSync(
  resolve(process.cwd(), "app/account/page.tsx"),
  "utf8",
);

/**
 * Structural guarantees for the /account member dashboard.
 *
 * These are source-level assertions, matching the convention already used in
 * `account-hub.test.ts` (the repo has no React rendering harness). They exist
 * to lock down the things a visual refactor is most likely to break silently:
 * externally-linked anchor ids, section priority order, and the placement of
 * the password-change confirmation.
 */
describe("account page layout", () => {
  it("keeps the externally-linked anchor ids", () => {
    // /account#serving-interests is linked from app/serve/_components/ServeInterestForm.tsx
    expect(accountPageSrc).toMatch(/id="serving-interests"/);
    // /account#church-notices is linked from lib/account-hub.ts (next-steps primary CTA)
    expect(accountPageSrc).toMatch(/id="church-notices"/);
  });

  it("keeps the anchor ids on the correct cards", () => {
    // The id must sit on the Church Notices card, not somewhere else in the file.
    const noticesAt = accountPageSrc.indexOf('id="church-notices"');
    const noticesTitleAt = accountPageSrc.indexOf("<CardTitle>Church Notices</CardTitle>");
    const servingAt = accountPageSrc.indexOf('id="serving-interests"');
    const servingTitleAt = accountPageSrc.indexOf("<CardTitle>Serving Interests</CardTitle>");

    expect(noticesAt).toBeGreaterThan(-1);
    expect(noticesTitleAt).toBeGreaterThan(-1);
    expect(servingAt).toBeGreaterThan(-1);
    expect(servingTitleAt).toBeGreaterThan(-1);

    // Each id belongs to the card whose title it names.
    expect(Math.abs(noticesAt - noticesTitleAt)).toBeLessThan(400);
    expect(Math.abs(servingAt - servingTitleAt)).toBeLessThan(400);
  });

  it("orders sections so giving and next steps come before profile and security", () => {
    const order = [
      "<CardTitle>My Giving</CardTitle>",
      "<CardTitle>Your next steps</CardTitle>",
      "<CardTitle>Connect Groups</CardTitle>",
      "<CardTitle>Activity</CardTitle>",
      "<CardTitle>Church Notices</CardTitle>",
      "<CardTitle>Serving Interests</CardTitle>",
      "<CardTitle>Profile</CardTitle>",
      "<CardTitle>Account security</CardTitle>",
    ].map((marker) => accountPageSrc.indexOf(marker));

    for (const [i, at] of order.entries()) {
      expect(at, `section ${i} (${order[i]}) is missing from the page`).toBeGreaterThan(-1);
    }
    for (let i = 1; i < order.length; i += 1) {
      expect(
        order[i],
        `section ${i} must appear after section ${i - 1}`,
      ).toBeGreaterThan(order[i - 1]);
    }
  });

  it("renders each dashboard section exactly once", () => {
    for (const component of [
      "AccountGivingSection",
      "AccountNextStepsPanel",
      "AccountMembershipSections",
      "AccountNotificationsSection",
      "AccountChurchNotices",
      "AccountServeInterests",
      "ProfileCompletenessIndicator",
      "MemberProfileForm",
      "AccountSecuritySection",
    ]) {
      const occurrences = accountPageSrc.split(`<${component}`).length - 1;
      expect(occurrences, `${component} should render exactly once`).toBe(1);
    }
  });

  it("keeps the password-change confirmation above the dashboard columns", () => {
    const alertAt = accountPageSrc.indexOf('searchParams.password === "updated"');
    const firstCardAt = accountPageSrc.indexOf("<Card");

    expect(alertAt).toBeGreaterThan(-1);
    expect(firstCardAt).toBeGreaterThan(-1);
    expect(alertAt).toBeLessThan(firstCardAt);
  });

  it("still requires a session and redirects unauthenticated visitors", () => {
    expect(accountPageSrc).toMatch(/requireUser\("\/login"\)/);
  });
});
