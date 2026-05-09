import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title:       "Coltiva — Agricultural intelligence for Uganda's cooperatives",
  description:
    "Coltiva connects Ugandan smallholder farmers and cooperatives to weather forecasts, soil insights, and market data via SMS and dashboards.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://coltiva.aeris.agro",
  ),
  openGraph: {
    title:       "Coltiva — Agricultural intelligence for Uganda's cooperatives",
    description: "Weather, soil, and market intelligence for Ugandan farmers.",
    siteName:    "Coltiva",
    type:        "website",
  },
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
