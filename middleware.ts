import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { isSupabaseConfigured, publicEnv } from "@/lib/env";

/**
 * Next.js only loads middleware from the project root (or src/).
 * Session refresh only — does NOT gate public pages.
 * Admin authorization remains in `app/admin/(protected)/layout.tsx`.
 *
 * Also sets a per-request nonce and a Content-Security-Policy-Report-Only header
 * with that nonce. The policy is report-only for safe rollout; once the
 * violation stream is clean, flip the header name to "Content-Security-Policy"
 * (a one-word change) to enforce.
 */
export async function middleware(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.next({ request });
  }

  // Generate a per-request nonce for CSP
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

  let response = NextResponse.next({
    request: {
      headers: new Headers(request.headers),
    },
  });
  // Expose the nonce to the App Router via a request header
  response.headers.set("x-nonce", nonce);

  const supabase = createServerClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL!,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request: {
              headers: new Headers(request.headers),
            },
          });
          // Re-apply the nonce header after session refresh recreates the response
          response.headers.set("x-nonce", nonce);
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  await supabase.auth.getUser();

  // Build the CSP with the per-request nonce (report-only for safe rollout)
  const csp = [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "img-src 'self' data: blob: https://*.supabase.co https://img.youtube.com https://i.ytimg.com https://*.ytimg.com",
    "media-src 'self' https://*.supabase.co blob:",
    "font-src 'self' data: https://fonts.gstatic.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.safaricom.co.ke https://sandbox.safaricom.co.ke",
    "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com",
    "report-uri /api/csp-report",
  ].join("; ");

  response.headers.set("Content-Security-Policy-Report-Only", csp);

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
