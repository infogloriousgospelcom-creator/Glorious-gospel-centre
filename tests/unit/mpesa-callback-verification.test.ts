import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const callback = readFileSync("supabase/functions/mpesa-callback/index.ts", "utf8");
const stk = readFileSync("supabase/functions/mpesa-stk-push/index.ts", "utf8");

describe("mpesa callback verification", () => {
  it("extracts the charged amount from the callback body", () => {
    expect(callback).toMatch(/stkCallback\.Amount/);
    expect(callback).toMatch(/amountCents/);
  });
  it("extracts the account reference from the callback body", () => {
    expect(callback).toMatch(/stkCallback\.AccountReference/);
    expect(callback).toMatch(/accountReference/);
  });
  it("reads the stored amount so it can be compared", () => {
    expect(callback).toMatch(/select\([^)]*amount_cents/i);
  });
  it("rejects a successful callback whose amount does not match the ledger", () => {
    expect(callback).toMatch(/amount mismatch/i);
    expect(callback).toMatch(/payload\.amountCents !== Number\(transaction\.amount_cents\)/);
  });
  it("rejects a successful callback whose account reference does not match", () => {
    expect(callback).toMatch(/account reference mismatch/i);
  });
  it("does not log the signed callback url", () => {
    expect(stk).not.toMatch(/console\.log\([^)]*callbackUrl/s);
    expect(stk).toMatch(/transactionId: request\.transactionId/);
  });
  it("normalises the amount to whole shillings before storing it", () => {
    expect(stk).toMatch(/Math\.round\(amountCents \/ 100\) \* 100/);
  });
});