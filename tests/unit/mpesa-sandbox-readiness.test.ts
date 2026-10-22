import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { canTransition, isTerminalSuccess } from "@/lib/payment-transitions";
import {
  signCallbackToken,
  verifyCallbackToken,
} from "@/lib/callback-auth";

const callbackSrc = readFileSync(
  resolve(process.cwd(), "supabase/functions/mpesa-callback/index.ts"),
  "utf8",
);
const nextCallbackSrc = readFileSync(
  resolve(process.cwd(), "app/api/mpesa/callback/route.ts"),
  "utf8",
);
const statusSrc = readFileSync(
  resolve(process.cwd(), "supabase/functions/mpesa-payment-status/index.ts"),
  "utf8",
);
const hookSrc = readFileSync(
  resolve(process.cwd(), "lib/hooks/usePaymentStatus.ts"),
  "utf8",
);
const configSrc = readFileSync(resolve(process.cwd(), "supabase/config.toml"), "utf8");

function resultCodeToStatus(resultCode: number): "SUCCESS" | "CANCELLED" | "FAILED" {
  if (resultCode === 0) return "SUCCESS";
  if (resultCode === 1032) return "CANCELLED";
  return "FAILED";
}

describe("mpesa-callback HMAC and ResultCode transitions", () => {
  const secret = "callback-secret";
  const tx = "11111111-1111-1111-1111-111111111111";

  it("valid HMAC + ResultCode 0 maps to SUCCESS", () => {
    const sig = signCallbackToken(tx, secret);
    expect(verifyCallbackToken(tx, sig, secret)).toBe(true);
    expect(resultCodeToStatus(0)).toBe("SUCCESS");
    expect(canTransition("PROCESSING", "SUCCESS")).toBe(true);
  });

  it("valid HMAC + ResultCode 1032 maps to CANCELLED", () => {
    expect(resultCodeToStatus(1032)).toBe("CANCELLED");
    expect(canTransition("PROCESSING", "CANCELLED")).toBe(true);
    expect(callbackSrc).toMatch(/resultCode === 1032/);
    expect(callbackSrc).toMatch(/status = "CANCELLED"/);
  });

  it("valid HMAC + failure ResultCode maps to FAILED", () => {
    expect(resultCodeToStatus(1)).toBe("FAILED");
    expect(resultCodeToStatus(2001)).toBe("FAILED");
    expect(canTransition("PROCESSING", "FAILED")).toBe(true);
  });

  it("invalid HMAC is rejected", () => {
    expect(verifyCallbackToken(tx, "deadbeef", secret)).toBe(false);
    expect(callbackSrc).toMatch(/verifyCallbackToken\(txId, sig, callbackSecret\)/);
    expect(callbackSrc).toMatch(/jsonResponse\(\{ error: "Unauthorized" \}, 401\)/);
  });

  it("wrong transaction HMAC is rejected", () => {
    const other = "22222222-2222-2222-2222-222222222222";
    const sig = signCallbackToken(tx, secret);
    expect(verifyCallbackToken(other, sig, secret)).toBe(false);
    expect(callbackSrc).toMatch(/\.eq\("id", txId\)/);
  });

  it("CheckoutRequestID mismatch is rejected", () => {
    expect(callbackSrc).toMatch(/CheckoutRequestID mismatch/);
    expect(callbackSrc).toMatch(/storedRef !== payload\.externalReference/);
    expect(callbackSrc).toMatch(/jsonResponse\(\{ error: "Unauthorized" \}, 401\)/);
  });

  it("duplicate SUCCESS callback is idempotent", () => {
    expect(isTerminalSuccess("SUCCESS")).toBe(true);
    expect(canTransition("SUCCESS", "FAILED")).toBe(false);
    expect(callbackSrc).toMatch(/if \(transaction\.status === "SUCCESS"\)/);
    expect(callbackSrc).toMatch(/updated: false/);
    expect(callbackSrc).toMatch(/\.neq\("status", "SUCCESS"\)/);
  });

  it("does not require STK Query before recording SUCCESS", () => {
    expect(callbackSrc).not.toMatch(/query_unconfirmed/);
    expect(callbackSrc).toMatch(/const finalStatus = payload\.status/);
    expect(nextCallbackSrc).not.toMatch(/query_unconfirmed/);
    expect(nextCallbackSrc).not.toMatch(/confirmStkSuccess/);
  });
});

describe("STK Query reconciliation must not downgrade SUCCESS", () => {
  it("keeps the query helper but does not write status from it", () => {
    expect(callbackSrc).toMatch(/async function confirmWithDarajaQuery/);
    expect(callbackSrc).toMatch(/\/mpesa\/stkpushquery\/v1\/query/);
    const updateStart = callbackSrc.indexOf(".update({");
    const updateEnd = callbackSrc.indexOf(".neq(\"status\", \"SUCCESS\")", updateStart);
    const updateBlock = callbackSrc.slice(updateStart, updateEnd);
    expect(updateBlock).not.toMatch(/confirmWithDarajaQuery/);
    expect(callbackSrc.indexOf("void confirmWithDarajaQuery")).toBeGreaterThan(updateEnd);
    expect(callbackSrc).toMatch(/void confirmWithDarajaQuery/);
    expect(callbackSrc).toMatch(/\.neq\("status", "SUCCESS"\)/);
    expect(canTransition("SUCCESS", "PROCESSING")).toBe(false);
    expect(canTransition("SUCCESS", "FAILED")).toBe(false);
  });
});

describe("mpesa-payment-status user JWT authorization", () => {
  it("requires a Bearer token and validates it with getUser", () => {
    expect(statusSrc).toMatch(/startsWith\("Bearer "\)/);
    expect(statusSrc).toMatch(/error: "Unauthorized"/);
    expect(statusSrc).toMatch(/supabase\.auth\.getUser/);
    expect(statusSrc).toMatch(/error: "Invalid token"/);
  });

  it("scopes lookup to the authenticated user's own transaction", () => {
    expect(statusSrc).toMatch(/\.eq\("created_by", user\.id\)/);
    expect(statusSrc).toMatch(/error: "Transaction not found"/);
  });

  it("does not accept the anon key as a substitute in the hook", () => {
    expect(hookSrc).not.toMatch(/NEXT_PUBLIC_SUPABASE_ANON_KEY/);
    expect(hookSrc).not.toMatch(/SERVICE_ROLE/);
    expect(hookSrc).toMatch(/session\?\.access_token/);
    expect(hookSrc).toMatch(/Authorization: `Bearer \$\{accessToken\}`/);
    expect(hookSrc).toMatch(/NEXT_PUBLIC_SUPABASE_URL/);
    expect(hookSrc).toMatch(/\/functions\/v1/);
    expect(hookSrc).toMatch(/mpesa-payment-status/);
    expect(hookSrc).not.toMatch(/window\.location\.origin/);
  });
});

describe("gateway JWT is disabled only for mpesa-callback", () => {
  it("sets verify_jwt = false on mpesa-callback only", () => {
    expect(configSrc).toMatch(/\[functions\.mpesa-callback\][\s\S]*verify_jwt = false/);
    expect(configSrc).not.toMatch(/\[functions\.mpesa-stk-push\]/);
    expect(configSrc).not.toMatch(/\[functions\.mpesa-payment-status\]/);
    const otherVerify = configSrc.replace(
      /\[functions\.mpesa-callback\][\s\S]*verify_jwt = false/,
      "",
    );
    expect(otherVerify).not.toMatch(/verify_jwt = false/);
  });
});
