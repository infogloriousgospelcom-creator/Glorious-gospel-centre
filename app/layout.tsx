import type { Metadata, Viewport } from "next";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Glorious Gospel Centre",
    template: "%s · Glorious Gospel Centre",
  },
  description:
    "Glorious Gospel Centre Church — worship, community, teaching, and outreach.",
  openGraph: {
    type: "website",
    siteName: "Glorious Gospel Centre",
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2f3825",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-brand-900">
        {children}
      </body>
    </html>
  );
}
