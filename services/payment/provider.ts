import "server-only";

/**
 * Payment provider abstraction.
 *
 * Every concrete provider (M-Pesa Daraja, Stripe, etc.) must implement
 * this interface. The giving service depends only on this interface —
 * never on a concrete provider — so the implementation can be swapped
 * at any time without changing business logic.
 */

export type ProviderMode = "live" | "mock";

export interface StkPushRequest {
  /** Internal transaction id from `giving_transactions.id`. */
  transactionId: string;
  /** Amount in the smallest currency unit (e.g. cents). */
  amountCents: number;
  /** ISO-4217 currency code, e.g. "KES". */
  currency: string;
  /** Customer phone number (E.164 preferred, but provider will normalize). */
  phone: string;
  /** Short description shown to the customer. */
  description: string;
  /** Absolute URL the provider will POST the result to. */
  callbackUrl: string;
}

export interface StkPushResult {
  /** Provider-side reference id used to match the callback. */
  externalReference: string;
  /** Provider raw response for debugging (sanitized; never logged verbatim in prod). */
  raw: unknown;
  /** True when the provider accepted the request. */
  accepted: boolean;
  /** Optional human-readable message from the provider. */
  message?: string;
}

export interface CallbackPayload {
  externalReference: string;
  status: "SUCCESS" | "FAILED" | "CANCELLED";
  raw: unknown;
}

export interface PaymentProvider {
  readonly id: string;
  readonly mode: ProviderMode;
  /** Initiate an STK Push / equivalent. */
  stkPush(req: StkPushRequest): Promise<StkPushResult>;
  /** Verify a callback signature (mock provider returns true; real provider checks HMAC). */
  verifyCallback(rawBody: string, signature: string | null): boolean;
  /** Parse the provider's callback body into a normalized result. */
  parseCallback(rawBody: string): CallbackPayload;
}

export interface ProviderConfig {
  mode: ProviderMode;
  consumerKey?: string;
  consumerSecret?: string;
  shortcode?: string;
  passkey?: string;
  environment: "sandbox" | "production";
}

export function isMockMode(env: ProviderConfig): boolean {
  return env.mode === "mock" || !env.consumerKey || !env.consumerSecret || !env.shortcode || !env.passkey;
}
