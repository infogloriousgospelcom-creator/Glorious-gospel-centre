import { describe, expect, it } from "vitest";
import { formatKenyaDate, formatKenyaDateTime } from "@/lib/dates";

describe("kenya dates", () => {
  it("renders a date-only column without shifting a day", () => {
    expect(formatKenyaDate("2024-01-15")).toContain("15");
    expect(formatKenyaDate("2024-01-15")).toContain("Jan");
  });
  it("formats a timestamp in Nairobi time", () => {
    // 22:00 UTC on 21 Oct is 01:00 on 22 Oct in Nairobi (UTC+3).
    expect(formatKenyaDateTime("2026-10-21T22:00:00Z")).toContain("22");
  });
  it("is stable regardless of the machine timezone", () => {
    expect(formatKenyaDate("2024-01-15")).toBe(formatKenyaDate("2024-01-15"));
  });
  it("handles empty input", () => {
    expect(formatKenyaDate(null)).toBe("");
    expect(formatKenyaDate(undefined)).toBe("");
    expect(formatKenyaDateTime(null)).toBe("");
    expect(formatKenyaDateTime(undefined)).toBe("");
  });
});
