import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { computeAccountStats, type AccountStatsInput } from "@/lib/account-hub";

const accountPageSrc = readFileSync(
  resolve(process.cwd(), "app/account/page.tsx"),
  "utf8",
);
const statCardsSrc = readFileSync(
  resolve(process.cwd(), "app/account/_components/AccountStatCards.tsx"),
  "utf8",
);

function input(overrides: Partial<AccountStatsInput> = {}): AccountStatsInput {
  return {
    giving: { ok: true, items: [] },
    memberships: [],
    notifications: { ok: true, items: [] },
    serveInterests: { ok: true, items: [] },
    ...overrides,
  };
}

describe("account dashboard stats", () => {
  it("sums successful gifts and counts them", () => {
    const stats = computeAccountStats(
      input({
        giving: {
          ok: true,
          items: [
            { amount_cents: 100_000, currency: "KES", status: "SUCCESS" },
            { amount_cents: 25_050, currency: "KES", status: "SUCCESS" },
          ],
        },
      }),
    );

    expect(stats.giving.ok).toBe(true);
    expect(stats.giving.totalCents).toBe(125_050);
    expect(stats.giving.gifts).toBe(2);
    expect(stats.giving.currency).toBe("KES");
  });

  it("excludes non-successful gifts from the total but reports them as pending", () => {
    const stats = computeAccountStats(
      input({
        giving: {
          ok: true,
          items: [
            { amount_cents: 50_000, currency: "KES", status: "SUCCESS" },
            { amount_cents: 20_000, currency: "KES", status: "PENDING" },
            { amount_cents: 30_000, currency: "KES", status: "PROCESSING" },
            { amount_cents: 99_000, currency: "KES", status: "FAILED" },
            { amount_cents: 88_000, currency: "KES", status: "CANCELLED" },
          ],
        },
      }),
    );

    expect(stats.giving.totalCents).toBe(50_000);
    expect(stats.giving.gifts).toBe(1);
    expect(stats.giving.pending).toBe(2);
  });

  it("never adds amounts across different currencies", () => {
    const stats = computeAccountStats(
      input({
        giving: {
          ok: true,
          items: [
            { amount_cents: 100_000, currency: "KES", status: "SUCCESS" },
            { amount_cents: 500_000, currency: "USD", status: "SUCCESS" },
          ],
        },
      }),
    );

    // Only the first successful currency is summed.
    expect(stats.giving.currency).toBe("KES");
    expect(stats.giving.totalCents).toBe(100_000);
    expect(stats.giving.gifts).toBe(1);
  });

  it("returns honest zeros for a member with no data", () => {
    const stats = computeAccountStats(input());

    expect(stats.giving.ok).toBe(true);
    expect(stats.giving.totalCents).toBe(0);
    expect(stats.giving.gifts).toBe(0);
    expect(stats.giving.pending).toBe(0);
    expect(stats.groups.active).toBe(0);
    expect(stats.groups.pending).toBe(0);
    expect(stats.updates.unread).toBe(0);
    expect(stats.updates.total).toBe(0);
    expect(stats.serving.total).toBe(0);
    expect(stats.serving.accepted).toBe(0);
  });

  it("marks a failed load as not ok so the UI can show it is unavailable", () => {
    const stats = computeAccountStats(
      input({
        giving: { ok: false, items: [] },
        notifications: { ok: false, items: [] },
        serveInterests: { ok: false, items: [] },
      }),
    );

    expect(stats.giving.ok).toBe(false);
    expect(stats.updates.ok).toBe(false);
    expect(stats.serving.ok).toBe(false);
  });

  it("survives missing input without throwing", () => {
    const stats = computeAccountStats({
      giving: undefined as unknown as AccountStatsInput["giving"],
      memberships: undefined as unknown as AccountStatsInput["memberships"],
      notifications: undefined as unknown as AccountStatsInput["notifications"],
      serveInterests: undefined as unknown as AccountStatsInput["serveInterests"],
    });

    expect(stats.giving.ok).toBe(false);
    expect(stats.giving.totalCents).toBe(0);
    expect(stats.groups.active).toBe(0);
    expect(stats.updates.unread).toBe(0);
    expect(stats.serving.total).toBe(0);
  });

  it("ignores a non-finite amount rather than poisoning the total", () => {
    const stats = computeAccountStats(
      input({
        giving: {
          ok: true,
          items: [
            { amount_cents: 10_000, currency: "KES", status: "SUCCESS" },
            { amount_cents: Number.NaN, currency: "KES", status: "SUCCESS" },
          ],
        },
      }),
    );

    expect(stats.giving.totalCents).toBe(10_000);
  });

  it("counts active and pending Connect Group memberships", () => {
    const stats = computeAccountStats(
      input({
        memberships: [
          { status: "ACTIVE" },
          { status: "ACTIVE" },
          { status: "PENDING" },
          { status: "DECLINED" },
          { status: "LEFT" },
        ],
      }),
    );

    expect(stats.groups.active).toBe(2);
    expect(stats.groups.pending).toBe(1);
  });

  it("counts unread notifications by read_at", () => {
    const stats = computeAccountStats(
      input({
        notifications: {
          ok: true,
          items: [
            { read_at: null },
            { read_at: null },
            { read_at: "2026-01-01T00:00:00Z" },
          ],
        },
      }),
    );

    expect(stats.updates.unread).toBe(2);
    expect(stats.updates.total).toBe(3);
  });

  it("counts serving interests and those already accepted", () => {
    const stats = computeAccountStats(
      input({
        serveInterests: {
          ok: true,
          items: [
            { status: "NEW" },
            { status: "CONTACTED" },
            { status: "ACCEPTED" },
          ],
        },
      }),
    );

    expect(stats.serving.total).toBe(3);
    expect(stats.serving.accepted).toBe(1);
  });
});

describe("account stat cards wiring", () => {
  it("derives the stats from data the page already fetched", () => {
    expect(accountPageSrc).toMatch(/computeAccountStats/);
    expect(accountPageSrc).toMatch(/AccountStatCards/);
    // Every source maps rows it already has.
    expect(accountPageSrc).toMatch(/giving\.items\.map/);
    expect(accountPageSrc).toMatch(/memberships\.map/);
    expect(accountPageSrc).toMatch(/notifications\.items\.map/);
    expect(accountPageSrc).toMatch(/serveInterests\.items\.map/);
  });

  it("issues no new database access from the page", () => {
    // All data access goes through the services, exactly as before. A new
    // query would have to appear here.
    expect(accountPageSrc).not.toMatch(/\.from\(/);
    expect(accountPageSrc).not.toMatch(/\.rpc\(/);
    expect(accountPageSrc).not.toMatch(/createClient/);
  });

  it("renders the stat row above the dashboard columns", () => {
    const cardsAt = accountPageSrc.indexOf("<AccountStatCards");
    const gridAt = accountPageSrc.indexOf('className="grid gap-8 lg:grid-cols-2"');
    const alertAt = accountPageSrc.indexOf('searchParams.password === "updated"');

    expect(cardsAt).toBeGreaterThan(-1);
    expect(gridAt).toBeGreaterThan(-1);
    expect(alertAt).toBeGreaterThan(-1);
    expect(alertAt).toBeLessThan(cardsAt);
    expect(cardsAt).toBeLessThan(gridAt);
  });

  it("adds no client JavaScript for the stat cards", () => {
    expect(statCardsSrc).not.toMatch(/^"use client"/m);
    expect(statCardsSrc).not.toMatch(/\buseState\b/);
    expect(statCardsSrc).not.toMatch(/\buseEffect\b/);
  });

  it("renders an unavailable state instead of a zero when a source failed", () => {
    expect(statCardsSrc).toMatch(/History unavailable/);
    expect(statCardsSrc).toMatch(/giving\.ok/);
    expect(statCardsSrc).toMatch(/updates\.ok/);
    expect(statCardsSrc).toMatch(/serving\.ok/);
  });

  it("does not reveal a serving-interest status the member cannot already see", () => {
    // Only ACCEPTED is surfaced as a count; other statuses stay internal.
    expect(statCardsSrc).toMatch(/serving\.accepted/);
    expect(statCardsSrc).not.toMatch(/DECLINED|CLOSED/);
  });
});
