import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://aerisagro.com";
const manrope = Manrope({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-primary",
  display: "swap",
});

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
};

export const viewport: Viewport = {
  themeColor: "#0d1a10",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={manrope.variable}>{children}</body>
    </html>
  );
}
