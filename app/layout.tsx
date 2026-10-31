import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://padel-only-tournament-app.vercel.app"),
  title: "Arabiano Tour - Padel Tournament Platform",
  description: "Americano and Mexicano padel tournaments with live pairings and career leaderboard.",
  openGraph: {
    title: "Arabiano Tour - Padel Tournament Platform",
    description: "Americano & Mexicano padel tournaments with live automated pairings, career leaderboards & permanent match history.",
    url: "https://padel-only-tournament-app.vercel.app",
    siteName: "PadelOnly Tour",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "PadelOnly Tour - Americano & Mexicano Platform",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Arabiano Tour - Padel Tournament Platform",
    description: "Americano & Mexicano padel tournaments with live automated pairings and career leaderboards.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

import { ThemeProvider } from "next-themes";
import { TournamentProvider } from "@/context/TournamentContext";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <TournamentProvider>
            {children}
          </TournamentProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
