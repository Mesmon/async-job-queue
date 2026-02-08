import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { cn } from "@/lib/utils";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Async Job Queue",
  description: "Modern asynchronous job processing",
};

import { Providers } from "./components/providers";
import { SiteFooter } from "./components/site-footer";
import { SiteHeader } from "./components/site-header";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={cn(
          "min-h-screen bg-background font-sans antialiased flex flex-col",
          geistSans.variable,
          geistMono.variable,
        )}
      >
        <Providers>
          <SiteHeader />
          <main className="flex-grow flex flex-col items-center">{children}</main>
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
