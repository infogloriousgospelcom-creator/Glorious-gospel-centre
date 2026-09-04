import "server-only";
import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/env";

/**
 * Service-role Supabase client.
 *
 * ⚠️  BYPASSES ALL ROW-LEVEL SECURITY. Use ONLY inside server-only code
 *     paths for operations that authenticated users cannot perform under
 *     RLS — currently: writing to public.audit_logs and
 *     updating giving_transactions from the M-Pesa webhook.
 *
 * Never import this file from client components. Never log the resulting
 * client's key.
 */

let cached: SupabaseClient | null = null;

export function getServiceRoleClient(): SupabaseClient {
  if (cached) return cached;
  const env = getServerEnv();
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "Service-role client unavailable: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set.",
    );
  }
  cached = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
  return cached;
}