import type { Metadata, Viewport } from "next";
import "./globals.css";

import AppShell from "@/components/AppShell";

const siteUrl = "https://blog.rishavkamal.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  title: {
    default: "Behind the Code",
    template: "%s | Behind the Code",
  },

  description:
    "Behind the Code is a developer publishing platform where developers build, learn, and share their knowledge, projects, and experiences.",

  applicationName: "Behind the Code",

  authors: [
    {
      name: "Rishav Kamal",
    },
  ],

  creator: "Rishav Kamal",
  publisher: "Behind the Code",

  keywords: [
    "Behind the Code",
    "developer blog",
    "programming blog",
    "software engineering",
    "web development",
    "Java",
    "React",
    "DSA",
    "system design",
    "programming",
    "software development",
  ],

  alternates: {
    canonical: "/",
  },

  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Behind the Code",
    title: "Behind the Code",
    description:
      "A developer publishing platform where developers build, learn, and share.",
    locale: "en_US",
  },

  twitter: {
    card: "summary",
    title: "Behind the Code",
    description:
      "A developer publishing platform where developers build, learn, and share.",
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}