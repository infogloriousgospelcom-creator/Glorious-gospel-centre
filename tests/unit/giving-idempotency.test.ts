import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const fn = readFileSync("supabase/functions/mpesa-stk-push/index.ts", "utf8");
const migration = readFileSync("supabase/migrations/0042_relax_external_reference_unique.sql", "utf8");

describe("giving idempotency", () => {
  it("includes the user id in the idempotency key", () => {
    expect(fn).toMatch(/function generateIdempotencyKey\([^)]*userId/s);
  });
  it("makes the key unique per request rather than per time bucket", () => {
    expect(fn).toMatch(/randomUUID\(\)/);
    expect(fn).not.toMatch(/Math\.floor\(Date\.now\(\) \/ \(5 \* 60 \* 1000\)\)/);
  });
  it("releases the key when the provider call fails", () => {
    expect(fn).toMatch(/external_reference: null/);
  });
  it("does not apply the unique index to temp keys", () => {
    expect(migration).toMatch(/not like '%\|%'/);
  });
  it("still uses the normalised amount in the key", () => {
    expect(fn).toMatch(/generateIdempotencyKey\(\s*categoryId,\s*normalizedAmountCents/s);
  });
});
