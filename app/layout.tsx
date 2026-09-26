import type { Metadata } from "next";
import "./globals.css";

import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "Behind the Code",
  description:
    "A developer publishing platform for developers to build, learn, and share.",
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