import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import Script from "next/script";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "QuoteMate — Quote Calculator for Junk Removal",
  description:
    "Professional quote calculator for junk removal businesses. Create accurate quotes in 60 seconds.",
  // PWA / Apple home-screen
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "QuoteMate",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  // Green status-bar tint on Android Chrome and PWA installs
  themeColor: "#10b981",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="h-full font-sans">
        {children}
        <ServiceWorkerRegistration />
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-MRNCN2WJQM"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-MRNCN2WJQM');
          `}
        </Script>
      </body>
    </html>
  );
}
