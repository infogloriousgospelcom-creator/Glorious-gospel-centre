import "server-only";
import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/env";

/**
 * Service-role Supabase client (bypasses RLS).
 *
 * Use ONLY after application-layer validation (Zod, honeypot, rate limit)
 * for operations that must not be reachable via the anon key + REST.
 *
 * Never import from client components. Never log the key.
 */

let cached: SupabaseClient | null = null;

export function createServiceRoleClient(): SupabaseClient {
  if (cached) return cached;
  const env = getServerEnv();
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "Service-role client unavailable: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set.",
    );
  }
  cached = createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

export function isServiceRoleConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}
