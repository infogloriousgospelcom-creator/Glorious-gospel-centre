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

describe("account page two-column layout", () => {
  /** Content column: the member's own content, in priority order. */
  const MAIN_SECTIONS = [
    "<CardTitle>My Giving</CardTitle>",
    "<CardTitle>Your next steps</CardTitle>",
    "<CardTitle>Connect Groups</CardTitle>",
    "<CardTitle>Activity</CardTitle>",
    "<CardTitle>Church Notices</CardTitle>",
    "<CardTitle>Serving Interests</CardTitle>",
  ];
  /** Side column: settings. */
  const SIDE_SECTIONS = [
    "<CardTitle>Profile</CardTitle>",
    "<CardTitle>Account security</CardTitle>",
  ];

  it("uses a two-column grid at the lg breakpoint", () => {
    expect(accountPageSrc).toMatch(/lg:grid-cols-\[minmax\(0,1fr\)_20rem\]/);
    expect(accountPageSrc).toMatch(/lg:items-start/);
  });

  it("has exactly two column wrappers", () => {
    const wrappers = accountPageSrc.match(/<div className="space-y-8">/g) ?? [];
    expect(wrappers).toHaveLength(2);
  });

  it("puts the content sections in the main column and settings in the side column", () => {
    const mainStart = accountPageSrc.indexOf('<div className="space-y-8">');
    const sideStart = accountPageSrc.indexOf(
      '<div className="space-y-8">',
      mainStart + 1,
    );
    expect(mainStart).toBeGreaterThan(-1);
    expect(sideStart).toBeGreaterThan(mainStart);

    const mainCol = accountPageSrc.slice(mainStart, sideStart);
    const sideCol = accountPageSrc.slice(sideStart);

    for (const marker of MAIN_SECTIONS) {
      expect(mainCol, `${marker} should be in the main column`).toContain(marker);
      expect(sideCol, `${marker} should not be in the side column`).not.toContain(marker);
    }
    for (const marker of SIDE_SECTIONS) {
      expect(sideCol, `${marker} should be in the side column`).toContain(marker);
      expect(mainCol, `${marker} should not be in the main column`).not.toContain(marker);
    }
  });

  it("keeps the main column before the side column so mobile order is content first", () => {
    // On mobile the grid collapses to one column, so DOM order is visual
    // order: giving and next steps come before profile and security.
    const mainStart = accountPageSrc.indexOf('<div className="space-y-8">');
    const sideStart = accountPageSrc.indexOf(
      '<div className="space-y-8">',
      mainStart + 1,
    );
    expect(mainStart).toBeLessThan(sideStart);

    const givingAt = accountPageSrc.indexOf("<CardTitle>My Giving</CardTitle>");
    const profileAt = accountPageSrc.indexOf("<CardTitle>Profile</CardTitle>");
    expect(givingAt).toBeGreaterThan(-1);
    expect(profileAt).toBeGreaterThan(-1);
    expect(givingAt).toBeLessThan(profileAt);
  });

  it("drops the full-width grid spans now that each column is a stack", () => {
    expect(accountPageSrc).not.toMatch(/lg:col-span-2/);
  });

  it("keeps the anchor ids inside their column", () => {
    const mainStart = accountPageSrc.indexOf('<div className="space-y-8">');
    const sideStart = accountPageSrc.indexOf(
      '<div className="space-y-8">',
      mainStart + 1,
    );
    const mainCol = accountPageSrc.slice(mainStart, sideStart);
    expect(mainCol).toMatch(/id="church-notices"/);
    expect(mainCol).toMatch(/id="serving-interests"/);
  });

  it("adds no client state, so there is no flash of the wrong layout", () => {
    // No tab/panel switching means no client-side layout state at all.
    expect(accountPageSrc).not.toMatch(/^"use client"/m);
    expect(accountPageSrc).not.toMatch(/useState/);
    expect(accountPageSrc).not.toMatch(/useRouter/);
    expect(accountPageSrc).not.toMatch(/searchParams\.tab/);
  });

  it("does not add a loading boundary that could shift the layout", () => {
    expect(accountPageSrc).not.toMatch(/<Suspense/);
  });

  it("keeps the stat row and the password alert above the columns", () => {
    const alertAt = accountPageSrc.indexOf('searchParams.password === "updated"');
    const cardsAt = accountPageSrc.indexOf("<AccountStatCards");
    const gridAt = accountPageSrc.indexOf("grid gap-8 lg:grid-cols");
    expect(alertAt).toBeGreaterThan(-1);
    expect(cardsAt).toBeGreaterThan(-1);
    expect(gridAt).toBeGreaterThan(-1);
    expect(alertAt).toBeLessThan(cardsAt);
    expect(cardsAt).toBeLessThan(gridAt);
  });
});
