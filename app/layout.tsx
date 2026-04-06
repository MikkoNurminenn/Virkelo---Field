import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Oswald } from "next/font/google";

import { Toaster } from "@/components/ui/sonner";
import { brand } from "@/lib/brand";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const oswald = Oswald({
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: brand.appName,
  description: brand.description,
  icons: {
    icon: brand.logoMarkSrc,
    shortcut: brand.logoMarkSrc,
    apple: brand.logoMarkSrc,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#16324a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fi"
      className={`${geistSans.variable} ${geistMono.variable} ${oswald.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col selection:bg-primary selection:text-primary-foreground">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
