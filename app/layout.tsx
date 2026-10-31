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
  title: "Arabiano Tour - Padel Tournament Platform",
  description: "Americano and Mexicano padel tournaments with live pairings and career leaderboard.",
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
