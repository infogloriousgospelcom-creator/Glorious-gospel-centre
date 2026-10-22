import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { MpesaDarajaProvider } from "@/services/payment/mpesa";
import type { ProviderConfig } from "@/services/payment/provider";
import {
  buildSignedCallbackUrl,
  signCallbackToken,
  verifyCallbackToken,
  verifyBodyHmac,
} from "@/lib/callback-auth";
import { canTransition, isTerminalSuccess } from "@/lib/payment-transitions";
import { createHmac } from "node:crypto";

const createMockConfig = (
  overrides: Partial<ProviderConfig & { callbackSecret?: string }> = {},
): ProviderConfig & { callbackSecret?: string } => ({
  mode: "mock",
  environment: "sandbox",
  consumerKey: "test_key",
  consumerSecret: "test_secret",
  shortcode: "174379",
  passkey: "test_passkey",
  ...overrides,
});

describe("payment status transitions", () => {
  it("allows PENDING -> SUCCESS/FAILED/CANCELLED", () => {
    expect(canTransition("PENDING", "SUCCESS")).toBe(true);
    expect(canTransition("PENDING", "FAILED")).toBe(true);
    expect(canTransition("PROCESSING", "SUCCESS")).toBe(true);
  });

  it("forbids CANCELLED -> SUCCESS and SUCCESS -> FAILED", () => {
    expect(canTransition("CANCELLED", "SUCCESS")).toBe(false);
    expect(canTransition("SUCCESS", "FAILED")).toBe(false);
    expect(canTransition("FAILED", "SUCCESS")).toBe(false);
  });

  it("treats SUCCESS as terminal", () => {
    expect(isTerminalSuccess("SUCCESS")).toBe(true);
    expect(isTerminalSuccess("PENDING")).toBe(false);
  });
});

describe("callback URL token auth", () => {
  const secret = "callback-secret";
  const tx = "11111111-1111-1111-1111-111111111111";

  it("signs and verifies tokens", () => {
    const sig = signCallbackToken(tx, secret);
    expect(verifyCallbackToken(tx, sig, secret)).toBe(true);
  });

  it("rejects missing / invalid tokens", () => {
    expect(verifyCallbackToken(tx, null, secret)).toBe(false);
    expect(verifyCallbackToken(tx, "deadbeef", secret)).toBe(false);
    expect(verifyCallbackToken(tx, signCallbackToken(tx, secret), null)).toBe(false);
  });

  it("builds signed callback URLs", () => {
    const url = buildSignedCallbackUrl(
      "https://example.supabase.co/functions/v1/mpesa-callback",
      tx,
      secret,
    );
    const parsed = new URL(url);
    expect(parsed.searchParams.get("tx")).toBe(tx);
    expect(verifyCallbackToken(tx, parsed.searchParams.get("sig"), secret)).toBe(true);
  });

  it("verifies body HMAC", () => {
    const body = '{"ok":true}';
    const sig = createHmac("sha256", secret).update(body).digest("hex");
    expect(verifyBodyHmac(body, sig, secret)).toBe(true);
    expect(verifyBodyHmac(body, null, secret)).toBe(false);
    expect(verifyBodyHmac(body, sig, null)).toBe(false);
  });
});

describe("MpesaDarajaProvider verifyCallback fail-closed", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("mock rejects null signature (dev)", () => {
    vi.stubEnv("NODE_ENV", "development");
    const provider = new MpesaDarajaProvider(createMockConfig());
    expect(provider.verifyCallback("{}", null)).toBe(false);
    expect(provider.verifyCallback("{}", "dev-signature")).toBe(true);
  });

  it("mock rejects everything in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    const provider = new MpesaDarajaProvider(createMockConfig());
    expect(provider.verifyCallback("{}", "dev-signature")).toBe(false);
    expect(provider.verifyCallback("{}", null)).toBe(false);
  });

  it("live rejects missing secret / signature", () => {
    vi.stubEnv("NODE_ENV", "production");
    const noSecret = new MpesaDarajaProvider(
      createMockConfig({ mode: "live", callbackSecret: "" }),
    );
    expect(noSecret.verifyCallback("{}", "abc")).toBe(false);

    const withSecret = new MpesaDarajaProvider(
      createMockConfig({ mode: "live", callbackSecret: "test_secret" }),
    );
    expect(withSecret.verifyCallback("{}", null)).toBe(false);
    const body = '{"Body":{"stkCallback":{"CheckoutRequestID":"ws","ResultCode":0}}}';
    const sig = createHmac("sha256", "test_secret").update(body).digest("hex");
    expect(withSecret.verifyCallback(body, sig)).toBe(true);
    expect(withSecret.verifyCallback(body, "invalid")).toBe(false);
  });
});

describe("MpesaDarajaProvider parse + mock push", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "test");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("generates mock external reference on STK push", async () => {
    const provider = new MpesaDarajaProvider(createMockConfig());
    const result = await provider.stkPush({
      transactionId: "txn-123",
      amountCents: 10000,
      currency: "KES",
      phone: "254712345678",
      description: "Test payment",
      callbackUrl: "https://example.com/callback",
    });
    expect(result.accepted).toBe(true);
    expect(result.externalReference).toMatch(/^mock_/);
  });

  it("parses live success / failed / cancelled / malformed", () => {
    const provider = new MpesaDarajaProvider(createMockConfig({ mode: "live" }));
    expect(
      provider.parseCallback(
        JSON.stringify({
          Body: { stkCallback: { CheckoutRequestID: "ws", ResultCode: 0 } },
        }),
      ).status,
    ).toBe("SUCCESS");
    expect(
      provider.parseCallback(
        JSON.stringify({
          Body: { stkCallback: { CheckoutRequestID: "ws", ResultCode: 1032 } },
        }),
      ).status,
    ).toBe("CANCELLED");
    expect(
      provider.parseCallback(
        JSON.stringify({
          Body: { stkCallback: { CheckoutRequestID: "ws", ResultCode: 1 } },
        }),
      ).status,
    ).toBe("FAILED");
    expect(provider.parseCallback("not json").externalReference).toBe("");
  });
});
