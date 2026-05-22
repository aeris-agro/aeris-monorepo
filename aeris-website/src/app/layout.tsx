import type { Metadata, Viewport } from "next";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://aerisagro.com";

export const metadata: Metadata = {
  title: {
    default:  "AERIS Agro — Intelligence. Connected.",
    template: "%s · AERIS Agro",
  },
  description:
    "Agricultural intelligence for Uganda's farming economy. AERIS helps districts, farmer groups, and buyers see problems earlier and move crops with more confidence.",
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title:       "AERIS Agro — Intelligence. Connected.",
    description: "Agricultural intelligence for Uganda's farming economy.",
    type:        "website",
    siteName:    "AERIS Agro",
    url:         "/",
    images:      [{ url: "/images/aeris-og.png", width: 1200, height: 630, alt: "AERIS Agro product suite" }],
  },
  twitter: {
    card:        "summary_large_image",
    title:       "AERIS Agro — Intelligence. Connected.",
    description: "Agricultural intelligence for Uganda's farming economy.",
    images:      ["/images/aeris-og.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#0d1a10",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
