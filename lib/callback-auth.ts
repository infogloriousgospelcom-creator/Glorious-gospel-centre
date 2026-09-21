import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Daraja does not sign callbacks. We embed an HMAC of the internal
 * transaction id in CallBackURL query params at STK initiation time,
 * and verify it when the callback arrives.
 */

export function signCallbackToken(transactionId: string, secret: string): string {
  return createHmac("sha256", secret).update(`ggc-callback:${transactionId}`).digest("hex");
}

export function verifyCallbackToken(
  transactionId: string,
  token: string | null | undefined,
  secret: string | null | undefined,
): boolean {
  if (!secret || !token || !transactionId) return false;
  const expected = signCallbackToken(transactionId, secret);
  try {
    const a = Buffer.from(expected, "hex");
    const b = Buffer.from(token.toLowerCase(), "hex");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function buildSignedCallbackUrl(
  baseUrl: string,
  transactionId: string,
  secret: string,
): string {
  const url = new URL(baseUrl);
  url.searchParams.set("tx", transactionId);
  url.searchParams.set("sig", signCallbackToken(transactionId, secret));
  return url.toString();
}

/** Timing-safe hex HMAC of an arbitrary message (body signatures). */
export function verifyBodyHmac(
  rawBody: string,
  signature: string | null,
  secret: string | null | undefined,
): boolean {
  if (!secret || !signature) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  try {
    const a = Buffer.from(expected, "hex");
    const b = Buffer.from(signature, "hex");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
