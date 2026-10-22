// tests/unit/giving-limits.test.ts
import { describe, expect, it } from "vitest";
import { MAX_GIFT_CENTS, MAX_GIFT_SHILLINGS } from "@/lib/giving-limits";

describe("giving limits", () => {
  it("agrees between cents and shillings", () => {
    expect(MAX_GIFT_CENTS).toBe(MAX_GIFT_SHILLINGS * 100);
  });
  it("is 100,000 KES", () => {
    expect(MAX_GIFT_SHILLINGS).toBe(100_000);
  });
});
