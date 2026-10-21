import type { Metadata, Viewport } from "next";
import { Inter, Poppins, Source_Serif_4, Cormorant_Garamond } from "next/font/google";
import { TopBar } from "@/components/layout/TopBar";
import { JsonLd } from "@/components/seo/JsonLd";
import { DEFAULT_SEO, buildChurchSchema, buildWebSiteSchema, siteUrl } from "@/lib/seo";
import { getSiteSettings, getActiveSocialLinks, getPublishedServices } from "@/services/content";
import { dayName } from "@/types/content";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
  weight: ["400", "500", "600"],
});

const poppins = Poppins({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
  weight: ["400", "600"],
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-serif",
  weight: ["400", "600"],
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display-serif",
  weight: ["400", "600"],
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
    "Glorious Gospel Centre Church",
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
  themeColor: "#062B87",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [settings, socialLinks, services] = await Promise.all([
    getSiteSettings(),
    getActiveSocialLinks(),
    getPublishedServices(),
  ]);

  const siteUrlRoot = siteUrl("/");
  const sameAs = socialLinks.filter((s) => s.url && s.url.trim() !== "").map((s) => s.url);

  // Map services to openingHours format using the existing dayName helper
  const openingHours = services.map((s) => ({
    day: dayName(s.day_of_week),
    opens: s.start_time.slice(0, 5), // HH:MM from HH:MM:SS
    ...(s.end_time ? { closes: s.end_time.slice(0, 5) } : {}),
  }));

  const churchSchema = buildChurchSchema({
    name: settings.church_name,
    description: settings.seo_default_description ?? DEFAULT_SEO.defaultDescription,
    url: siteUrlRoot,
    logoUrl: siteUrl("/logo.webp"),
    imageUrl: siteUrl(settings.seo_default_og_image ?? DEFAULT_SEO.defaultOgImage),
    telephone: settings.phone,
    email: settings.email,
    address: settings.address,
    addressLocality: settings.locality,
    addressRegion: settings.region,
    postalCode: settings.postal_code,
    latitude: settings.latitude,
    longitude: settings.longitude,
    sameAs,
    openingHours,
  });

  const webSiteSchema = buildWebSiteSchema(siteUrlRoot, `${siteUrlRoot.replace(/\/+$/, "")}/#church`);

  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable} ${sourceSerif.variable} ${cormorant.variable}`}>
      <body className="min-h-screen bg-surface text-ink antialiased">
        <a href="#main" className="skip-link">
          Skip to main content
        </a>
        <TopBar />
        {children}
        <JsonLd data={[churchSchema, webSiteSchema]} />
      </body>
    </html>
  );
}
