import { describe, expect, it } from "vitest";
import { isMockMode } from "@/services/payment/provider";

describe("payment provider.isMockMode", () => {
  it("returns true when mode is mock", () => {
    expect(
      isMockMode({
        mode: "mock",
        environment: "sandbox",
      }),
    ).toBe(true);
  });

  it("returns true when any required credential is missing", () => {
    expect(
      isMockMode({
        mode: "live",
        environment: "sandbox",
        consumerKey: "x",
        consumerSecret: "y",
        // shortcode + passkey missing
      }),
    ).toBe(true);
  });

  it("returns false when all credentials are set and mode is live", () => {
    expect(
      isMockMode({
        mode: "live",
        environment: "production",
        consumerKey: "x",
        consumerSecret: "y",
        shortcode: "123",
        passkey: "abc",
      }),
    ).toBe(false);
  });
});