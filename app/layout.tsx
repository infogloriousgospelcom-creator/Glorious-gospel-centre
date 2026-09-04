import type { Metadata, Viewport } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import { TopBar } from "@/components/layout/TopBar";
import { JsonLd } from "@/components/seo/JsonLd";
import { DEFAULT_SEO, buildChurchSchema, siteUrl } from "@/lib/seo";
import { getSiteSettings } from "@/services/content";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-serif",
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(DEFAULT_SEO.siteUrl),
  title: {
    default: DEFAULT_SEO.churchName,
    template: `%s · ${DEFAULT_SEO.churchName}`,
  },
  description: DEFAULT_SEO.defaultDescription,
  applicationName: DEFAULT_SEO.churchName,
  keywords: [
    "church",
    "Glorious Gospel Centre",
    "Kenya",
    "worship",
    "sermons",
    "ministries",
    "prayer",
    "events",
    "gospel",
  ],
  authors: [{ name: DEFAULT_SEO.churchName }],
  creator: DEFAULT_SEO.churchName,
  publisher: DEFAULT_SEO.churchName,
  formatDetection: { email: false, address: false, telephone: false },
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: DEFAULT_SEO.churchName,
    title: DEFAULT_SEO.churchName,
    description: DEFAULT_SEO.defaultDescription,
    url: DEFAULT_SEO.siteUrl,
    locale: "en_KE",
    images: [
      {
        url: DEFAULT_SEO.defaultOgImage,
        alt: DEFAULT_SEO.churchName,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_SEO.churchName,
    description: DEFAULT_SEO.defaultDescription,
    images: [DEFAULT_SEO.defaultOgImage],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  icons: {
    icon: [{ url: "/favicon.ico" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2f3825",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();
  const churchSchema = buildChurchSchema({
    name: settings.church_name,
    description:
      settings.seo_default_description ?? DEFAULT_SEO.defaultDescription,
    url: siteUrl("/"),
    logoUrl: siteUrl("/logo.png"),
    imageUrl: siteUrl(settings.seo_default_og_image ?? DEFAULT_SEO.defaultOgImage),
    telephone: settings.phone,
    email: settings.email,
    address: settings.address,
  });

  return (
    <html lang="en" className={`${inter.variable} ${sourceSerif.variable}`}>
      <body className="min-h-screen bg-surface text-ink antialiased">
        <a href="#main" className="skip-link">
          Skip to main content
        </a>
        <TopBar />
        {children}
        <JsonLd data={churchSchema} />
      </body>
    </html>
  );
}