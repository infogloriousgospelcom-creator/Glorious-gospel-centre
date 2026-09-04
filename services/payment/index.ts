import "server-only";
import { getServerEnv } from "@/lib/env";
import { MpesaDarajaProvider } from "./mpesa";
import type { PaymentProvider } from "./provider";

let cached: PaymentProvider | null = null;

/**
 * Returns the active payment provider.
 *
 * The provider is constructed once per server process. Construction is
 * cheap; the cache exists primarily to ensure consistent configuration
 * within a request lifecycle.
 *
 * NOTE: This file is the ONLY place that should reference M-Pesa env
 * vars. Consumers should depend on the abstract interface.
 */
export function getPaymentProvider(): PaymentProvider {
  if (cached) return cached;
  const env = getServerEnv();
  if (!env.M_PESA_CALLBACK_SECRET) {
    throw new Error(
      "M_PESA_CALLBACK_SECRET is required to verify inbound Daraja webhooks. " +
        "It must be a unique secret distinct from M_PESA_PASSKEY.",
    );
  }
  cached = new MpesaDarajaProvider({
    mode: env.M_PESA_CONSUMER_KEY ? "live" : "mock",
    consumerKey: env.M_PESA_CONSUMER_KEY,
    consumerSecret: env.M_PESA_CONSUMER_SECRET,
    shortcode: env.M_PESA_SHORTCODE,
    passkey: env.M_PESA_PASSKEY,
    environment: env.M_PESA_ENVIRONMENT,
    callbackSecret: env.M_PESA_CALLBACK_SECRET,
  });
  return cached;
}
