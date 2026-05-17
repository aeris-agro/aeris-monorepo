import type { Metadata } from "next";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://aerisagro.com";

export const metadata: Metadata = {
  title: {
    default:  "AERIS Agro — Intelligence. Connected.",
    template: "%s · AERIS Agro",
  },
  description:
    "Integrated agricultural intelligence infrastructure for Uganda. Three platforms — Aeryion, Coltiva, LinkTrade — closing the $445M intelligence gap for Lango farmers.",
  metadataBase: new URL(SITE_URL),
  openGraph: {
    title:       "AERIS Agro — Intelligence. Connected.",
    description: "Agricultural intelligence infrastructure for Uganda's Lango sub-region.",
    type:        "website",
    siteName:    "AERIS Agro",
  },
  twitter: {
    card:        "summary_large_image",
    title:       "AERIS Agro — Intelligence. Connected.",
    description: "Agricultural intelligence infrastructure for Uganda.",
  },
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
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
