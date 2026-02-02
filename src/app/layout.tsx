import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { AuthProvider } from "@/context/AuthContext";
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
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://greenbirdhomestead.com.np",
    title: "Greenbird Homestead | Organic. Fresh. Local.",
    description: "Experience the taste of nature with our organically raised livestock and extensive crop selection.",
    siteName: "Greenbird Homestead",
    images: [
      {
        url: "/icon.png", // Assuming icon.png is a suitable social share image, ideally should be a larger cover image
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
    images: ["/icon.png"],
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
};

export const viewport: Viewport = {
  themeColor: "#2D5A27",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col bg-gray-50`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
