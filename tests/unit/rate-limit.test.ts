import { describe, expect, it } from "vitest";
import { consume } from "@/lib/rate-limit";

describe("rate-limit consume", () => {
  it("allows up to capacity requests in the window", () => {
    const key = "k-1";
    const cfg = { capacity: 3, windowMs: 60_000 };
    expect(consume(key, cfg).ok).toBe(true);
    expect(consume(key, cfg).ok).toBe(true);
    expect(consume(key, cfg).ok).toBe(true);
    const blocked = consume(key, cfg);
    expect(blocked.ok).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.resetMs).toBeGreaterThan(0);
  });

  it("isolates buckets per key", () => {
    const cfg = { capacity: 1, windowMs: 60_000 };
    expect(consume("a", cfg).ok).toBe(true);
    expect(consume("b", cfg).ok).toBe(true);
    expect(consume("a", cfg).ok).toBe(false);
    expect(consume("b", cfg).ok).toBe(false);
  });
});