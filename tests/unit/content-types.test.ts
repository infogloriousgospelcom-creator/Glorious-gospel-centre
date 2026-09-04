import { describe, expect, it } from "vitest";
import { dayName, DAYS_OF_WEEK } from "@/types/content";

describe("dayName / DAYS_OF_WEEK", () => {
  it("returns the day name for valid day-of-week numbers", () => {
    expect(dayName(0)).toBe("Sunday");
    expect(dayName(1)).toBe("Monday");
    expect(dayName(6)).toBe("Saturday");
  });

  it("returns empty string for out-of-range values", () => {
    expect(dayName(-1)).toBe("");
    expect(dayName(7)).toBe("");
    expect(dayName(99)).toBe("");
  });

  it("exposes the canonical seven-day list", () => {
    expect(DAYS_OF_WEEK).toHaveLength(7);
    expect(DAYS_OF_WEEK[0]).toBe("Sunday");
    expect(DAYS_OF_WEEK[6]).toBe("Saturday");
  });
});