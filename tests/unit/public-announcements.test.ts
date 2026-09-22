import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  announcementExcerpt,
  filterActiveAnnouncements,
  isAnnouncementActiveNow,
} from "@/lib/announcements";
import { selectAccountNextSteps } from "@/lib/account-hub";

const contentSrc = readFileSync(
  resolve(process.cwd(), "services/content.ts"),
  "utf8",
);
const thisWeekSrc = readFileSync(
  resolve(process.cwd(), "components/church/ThisWeekSection.tsx"),
  "utf8",
);
const homePageSrc = readFileSync(resolve(process.cwd(), "app/page.tsx"), "utf8");
const accountPageSrc = readFileSync(
  resolve(process.cwd(), "app/account/page.tsx"),
  "utf8",
);
const accountNoticesSrc = readFileSync(
  resolve(process.cwd(), "app/account/_components/AccountChurchNotices.tsx"),
  "utf8",
);
const accountHubSrc = readFileSync(
  resolve(process.cwd(), "lib/account-hub.ts"),
  "utf8",
);
const dashboardSrc = readFileSync(
  resolve(process.cwd(), "app/admin/(protected)/dashboard/page.tsx"),
  "utf8",
);
const rlsSrc = readFileSync(
  resolve(process.cwd(), "supabase/migrations/0009_rls_policies.sql"),
  "utf8",
);

const NOW = new Date("2026-09-22T12:00:00.000Z");

describe("I-B9 announcement active window", () => {
  it("treats published (or status-omitted) in-window rows as active", () => {
    expect(
      isAnnouncementActiveNow(
        {
          status: "PUBLISHED",
          starts_at: "2026-09-01T00:00:00.000Z",
          ends_at: "2026-10-01T00:00:00.000Z",
        },
        NOW,
      ),
    ).toBe(true);

    expect(
      isAnnouncementActiveNow(
        { starts_at: null, ends_at: null },
        NOW,
      ),
    ).toBe(true);
  });

  it("excludes draft/unpublished by status when provided", () => {
    expect(
      isAnnouncementActiveNow(
        { status: "DRAFT", starts_at: null, ends_at: null },
        NOW,
      ),
    ).toBe(false);
    expect(
      isAnnouncementActiveNow(
        { status: "PENDING_APPROVAL", starts_at: null, ends_at: null },
        NOW,
      ),
    ).toBe(false);
  });

  it("excludes expired announcements when ends_at is in the past", () => {
    expect(
      isAnnouncementActiveNow(
        {
          status: "PUBLISHED",
          starts_at: "2026-08-01T00:00:00.000Z",
          ends_at: "2026-09-01T00:00:00.000Z",
        },
        NOW,
      ),
    ).toBe(false);
  });

  it("excludes future announcements when starts_at is in the future", () => {
    expect(
      isAnnouncementActiveNow(
        {
          status: "PUBLISHED",
          starts_at: "2026-10-01T00:00:00.000Z",
          ends_at: null,
        },
        NOW,
      ),
    ).toBe(false);
  });

  it("filters lists and leaves empty arrays empty", () => {
    expect(filterActiveAnnouncements([], NOW)).toEqual([]);
    const rows = [
      { id: "1", status: "PUBLISHED", starts_at: null, ends_at: null },
      { id: "2", status: "DRAFT", starts_at: null, ends_at: null },
      {
        id: "3",
        status: "PUBLISHED",
        starts_at: "2026-10-01T00:00:00.000Z",
        ends_at: null,
      },
      {
        id: "4",
        status: "PUBLISHED",
        starts_at: null,
        ends_at: "2026-09-01T00:00:00.000Z",
      },
    ];
    expect(filterActiveAnnouncements(rows, NOW).map((r) => r.id)).toEqual(["1"]);
  });

  it("truncates excerpts for compact UI", () => {
    const long = "a".repeat(200);
    expect(announcementExcerpt(long, 50).endsWith("…")).toBe(true);
    expect(announcementExcerpt("Short notice", 50)).toBe("Short notice");
  });
});

describe("I-B9 getActiveAnnouncements helper (static)", () => {
  it("queries PUBLISHED with start/end window and safe public columns only", () => {
    const fn = contentSrc.slice(
      contentSrc.indexOf("export async function getActiveAnnouncements"),
      contentSrc.indexOf("export async function getUpcomingEvents"),
    );
    expect(fn).toMatch(/\.eq\(\s*["']status["']\s*,\s*["']PUBLISHED["']\)/);
    expect(fn).toMatch(/starts_at\.is\.null,starts_at\.lte\./);
    expect(fn).toMatch(/ends_at\.is\.null,ends_at\.gt\./);
    expect(fn).toMatch(/filterActiveAnnouncements/);
    expect(fn).toMatch(
      /select\("id,title,body,starts_at,ends_at,is_pinned,published_at"\)/,
    );
    expect(fn).not.toMatch(/created_by|approved_by|updated_by/);
    expect(fn).not.toMatch(/createServiceRoleClient/);
  });

  it("preserves public RLS published-only select", () => {
    expect(rlsSrc).toMatch(/announcements_public_select/);
    expect(rlsSrc).toMatch(/using \(public\.is_published\(status\)\)/);
  });
});

describe("I-B9 homepage wiring (static)", () => {
  it("ThisWeekSection uses getActiveAnnouncements and hides empty notices", () => {
    expect(homePageSrc).toMatch(/ThisWeekSection/);
    expect(thisWeekSrc).toMatch(/getActiveAnnouncements/);
    expect(thisWeekSrc).toMatch(/Church Notices/);
    expect(thisWeekSrc).toMatch(/hasNotices/);
    expect(thisWeekSrc).not.toMatch(/member_notifications/);
    expect(thisWeekSrc).not.toMatch(/createServiceRoleClient/);
  });
});

describe("I-B9 Account Church Notices (static)", () => {
  it("account page uses the same safe announcement source", () => {
    expect(accountPageSrc).toMatch(/getActiveAnnouncements/);
    expect(accountPageSrc).toMatch(/AccountChurchNotices/);
    expect(accountPageSrc).toMatch(/Church Notices/);
    expect(accountPageSrc).toMatch(/hasActiveAnnouncements:\s*announcements\.length\s*>\s*0/);
    expect(accountPageSrc).not.toMatch(/member_notifications.*announcement/i);
  });

  it("places Church Notices after Activity and before next steps", () => {
    const activityIdx = accountPageSrc.indexOf(">Activity<");
    const noticesIdx = accountPageSrc.indexOf(">Church Notices<");
    const nextIdx = accountPageSrc.indexOf("Your next steps");
    expect(activityIdx).toBeGreaterThan(-1);
    expect(noticesIdx).toBeGreaterThan(activityIdx);
    expect(nextIdx).toBeGreaterThan(noticesIdx);
  });

  it("empty state is read-only and does not mark read or write notifications", () => {
    expect(accountNoticesSrc).toMatch(/No church notices are active/);
    expect(accountNoticesSrc).not.toMatch(/mark.*read/i);
    expect(accountNoticesSrc).not.toMatch(/member_notifications/);
    expect(accountNoticesSrc).not.toMatch(/insert/i);
  });

  it("does not create notification rows from announcement rendering", () => {
    expect(thisWeekSrc).not.toMatch(/\.from\(\s*["']member_notifications["']\)/);
    expect(accountNoticesSrc).not.toMatch(/\.from\(\s*["']member_notifications["']\)/);
    expect(accountPageSrc).not.toMatch(
      /from\(\s*["']member_notifications["']\)\.insert/,
    );
  });
});

describe("I-B9 next steps secondary notices link", () => {
  it("adds Church Notices as secondary only when announcements are active", () => {
    const without = selectAccountNextSteps({
      emailConfirmed: true,
      memberships: [],
      hasActiveAnnouncements: false,
    });
    expect(without.primary.href).toBe("/connect");
    expect(without.secondary.some((a) => a.href === "#church-notices")).toBe(false);

    const withNotices = selectAccountNextSteps({
      emailConfirmed: true,
      memberships: [],
      hasActiveAnnouncements: true,
    });
    expect(withNotices.primary.href).toBe("/connect");
    expect(withNotices.secondary.some((a) => a.href === "#church-notices")).toBe(true);
  });

  it("never lets notices override email or membership primary priority", () => {
    const unverified = selectAccountNextSteps({
      emailConfirmed: false,
      memberships: [
        { status: "ACTIVE", group_name: "Youth", group_slug: "youth", group_status: "OPEN" },
      ],
      hasActiveAnnouncements: true,
    });
    expect(unverified.primary.href).toBe("#account-security");
    expect(unverified.secondary.some((a) => a.href === "#church-notices")).toBe(true);

    const pending = selectAccountNextSteps({
      emailConfirmed: true,
      memberships: [
        { status: "PENDING", group_name: "Home", group_slug: "home", group_status: "OPEN" },
      ],
      hasActiveAnnouncements: true,
    });
    expect(pending.primary.href).toBe("/connect/home");
    expect(pending.primary.href).not.toBe("#church-notices");
  });

  it("account-hub documents secondary-only notices behavior", () => {
    expect(accountHubSrc).toMatch(/hasActiveAnnouncements/);
    expect(accountHubSrc).toMatch(/#church-notices/);
  });
});

describe("I-B9 admin copy alignment", () => {
  it("dashboard announcement action describes homepage and member account", () => {
    expect(dashboardSrc).toMatch(/homepage and member account/i);
    expect(dashboardSrc).not.toMatch(/Post to the homepage\./);
  });
});
