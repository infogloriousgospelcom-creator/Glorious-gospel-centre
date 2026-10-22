import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { isSupabaseConfigured, publicEnv } from "@/lib/env";
import { resolveMemberNext } from "@/lib/auth-redirects";

/**
 * Supabase Auth email confirmation / recovery callback (PKCE code exchange).
 * Never grants admin access — only establishes a session and redirects
 * to an allowlisted member destination.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = resolveMemberNext(url.searchParams.get("next"));
  const origin = url.origin;

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(new URL("/login?error=config", origin));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=auth", origin));
  }

  const cookieStore = cookies();
  const supabase = createServerClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL!,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    },
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL("/login?error=auth", origin));
  }

  return NextResponse.redirect(new URL(next, origin));
}
