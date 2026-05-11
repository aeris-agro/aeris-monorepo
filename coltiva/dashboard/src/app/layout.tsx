import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title:       "Coltiva Dashboard",
  description: "Your farm at a glance — weather, soil, market prices, and advice in one place.",
  robots:      "noindex, nofollow",
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
