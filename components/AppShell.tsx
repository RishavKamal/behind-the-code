"use client";

import Header from "@/components/Header";

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      {children}
    </>
  );
}