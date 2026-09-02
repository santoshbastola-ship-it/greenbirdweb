import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";

import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://greenbirdhomestead.com.np"),
  title: {
    default: "Greenbird Homestead | Organic Farm & Local Produce",
    template: "%s | Greenbird Homestead",
  },
  description: "Organic.Fresh.Local - Farm fresh products, organic produce, free-range livestock and farm operations management in Nepal.",
  keywords: ["organic farm", "fresh produce", "local food", "Nepal agriculture", "homestead", "free-range chicken", "organic vegetables", "farm stay"],
  authors: [{ name: "Greenbird Homestead" }],
  creator: "Greenbird Homestead",
  publisher: "Greenbird Homestead",
  applicationName: "Greenbird Homestead",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Greenbird",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://greenbirdhomestead.com.np",
    title: "Greenbird Homestead | Organic. Fresh. Local.",
    description: "Experience the taste of nature with our organically raised livestock and extensive crop selection.",
    siteName: "Greenbird Homestead",
    images: [
      {
        url: "/icons/icon-512x512.png",
        width: 512,
        height: 512,
        alt: "Greenbird Homestead Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Greenbird Homestead",
    description: "Organic.Fresh.Local - Farm fresh products and nature retreats.",
    images: ["/icons/icon-512x512.png"],
  },
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-180x180.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#2D5A27",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} antialiased min-h-screen flex flex-col bg-gray-50`}
      >
        <PWAInstallPrompt />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
