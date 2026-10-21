// tests/unit/giving-reaper.test.ts
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { canTransition } from "@/lib/payment-transitions";

const m = readFileSync("supabase/migrations/0043_giving_reaper.sql", "utf8");

describe("giving reaper", () => {
  it("allows PROCESSING to FAILED", () => {
    expect(canTransition("PROCESSING", "FAILED")).toBe(true);
  });
  it("allows PENDING to FAILED", () => {
    expect(canTransition("PENDING", "FAILED")).toBe(true);
  });
  it("expires stale transactions after 30 minutes", () => {
    expect(m).toMatch(/interval '30 minutes'/);
  });
  it("never expires a successful transaction", () => {
    expect(m).toMatch(/status in \('PENDING','PROCESSING'\)/);
  });
  it("schedules the reaper with pg_cron", () => {
    expect(m).toMatch(/cron\.schedule\(/);
    expect(m).toMatch(/'expire-giving-transactions'/);
    expect(m).toMatch(/'\*\/10 \* \* \* \*'/);
  });
  it("passes the cron command as a single-quoted string, not a dollar quote", () => {
    // A dollar-quoted string nested inside the dollar-quoted DO body closes
    // the body early and the migration fails to parse.
    expect(m).toMatch(/'select public\.expire_stale_giving_transactions\(\);'/);
    expect(m).not.toMatch(/\$\$select public\.expire_stale_giving_transactions\(\);\$\$/);
  });
});