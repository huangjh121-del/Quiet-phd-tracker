import { ClerkProvider } from "@clerk/nextjs";
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
  title: "Quiet PhD Tracker",
  description: "A focused, distraction-free reading tracker and spaced repetition vocabulary builder for PhD researchers.",
  metadataBase: new URL("https://quiet-phd-tracker.online"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Quiet PhD Tracker",
    description: "A focused, distraction-free reading tracker and spaced repetition vocabulary builder for PhD researchers.",
    url: "https://quiet-phd-tracker.online",
    siteName: "Quiet PhD Tracker",
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        <ClerkProvider>
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}