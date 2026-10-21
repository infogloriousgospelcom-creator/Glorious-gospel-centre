import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { canStaffTransition, isTerminalSuccess } from "@/lib/payment-transitions";

describe("giving status override", () => {
  it("forbids staff from fabricating a successful payment", () => {
    expect(canStaffTransition("PENDING", "SUCCESS")).toBe(false);
    expect(canStaffTransition("PROCESSING", "SUCCESS")).toBe(false);
  });
  it("forbids reopening a successful transaction", () => {
    expect(isTerminalSuccess("SUCCESS")).toBe(true);
    expect(canStaffTransition("SUCCESS", "PENDING")).toBe(false);
    expect(canStaffTransition("SUCCESS", "PROCESSING")).toBe(false);
    expect(canStaffTransition("SUCCESS", "CANCELLED")).toBe(false);
  });
  it("allows staff to cancel a pending or processing payment", () => {
    expect(canStaffTransition("PENDING", "FAILED")).toBe(true);
    expect(canStaffTransition("PROCESSING", "FAILED")).toBe(true);
    expect(canStaffTransition("PENDING", "CANCELLED")).toBe(true);
  });
  it("allows staff to correct a successful payment", () => {
    expect(canStaffTransition("SUCCESS", "FAILED")).toBe(true);
  });
  it("does not resurrect a failed or cancelled payment", () => {
    expect(canStaffTransition("FAILED", "SUCCESS")).toBe(false);
    expect(canStaffTransition("FAILED", "PENDING")).toBe(false);
    expect(canStaffTransition("CANCELLED", "SUCCESS")).toBe(false);
    expect(canStaffTransition("CANCELLED", "PENDING")).toBe(false);
  });
  it("applies the staff transition check before the service-role update", () => {
    const src = readFileSync("services/admin/giving.actions.ts", "utf8");
    const checkAt = src.indexOf("!canStaffTransition(prior.status");
    const writeAt = src.indexOf(".update({");
    expect(checkAt).toBeGreaterThan(-1);
    expect(checkAt).toBeLessThan(writeAt);
  });
});
