/** @type {import('next').NextConfig} */
const SECURITY_HEADERS = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-site" },
  {
    // Conservative baseline CSP. The site does not load third-party
    // scripts other than Supabase auth challenges; everything else is
    // same-origin. Adjust as new integrations are added.
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Supabase Storage hosts images; church assets live there.
      "img-src 'self' data: blob: https://*.supabase.co https://www.youtube.com https://i.ytimg.com https://player.vimeo.com",
      // Next.js App Router inserts runtime scripts; the inline nonce
      // strategy is intentionally avoided here to keep the config simple.
      "script-src 'self' 'unsafe-inline'",
      // Tailwind compiles to inline styles.
      "style-src 'self' 'unsafe-inline'",
      // Embedded YouTube / Vimeo for livestreams and sermon recordings.
      "frame-src https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.safaricom.co.ke https://sandbox.safaricom.co.ke",
      "font-src 'self' data:",
      "media-src 'self' https://*.supabase.co",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    typedRoutes: false,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: SECURITY_HEADERS,
      },
    ];
  },
};

export default nextConfig;