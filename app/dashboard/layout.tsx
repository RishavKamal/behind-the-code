"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const dashboardNavigation = [
  { name: "Overview", href: "/dashboard" },
  { name: "My Articles", href: "/dashboard/articles" },
  { name: "Following", href: "/dashboard/following" },
  { name: "Liked", href: "/dashboard/liked" },
  { name: "Bookmarks", href: "/dashboard/bookmarks" },
  { name: "New Article", href: "/dashboard/articles/new" },
];

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#f4f4f0] text-[#171717]">
      <div className="fixed inset-x-0 top-16 z-40 border-b border-[#d9d9d2] bg-[#f8f8f5]/95 shadow-[0_4px_18px_rgba(20,20,20,0.035)] backdrop-blur-md">
        <div className="mx-auto flex min-h-[58px] max-w-[1500px] items-center justify-between gap-6 px-5 sm:px-8 lg:px-10">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#171717] text-[10px] font-bold text-white">
              BT
            </span>

            <div className="hidden min-[480px]:block">
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#3568e8]">
                Creator space
              </p>
              <p className="text-xs font-semibold text-[#30302c]">
                Dashboard
              </p>
            </div>
          </div>

          <nav
            aria-label="Dashboard navigation"
            className="flex items-center gap-1 overflow-x-auto rounded-xl border border-[#deded8] bg-white p-1 shadow-sm"
          >
            {dashboardNavigation.map((item) => {
              const isActive =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative whitespace-nowrap rounded-lg px-3 py-2 text-[11px] font-semibold transition-all sm:px-4 ${
                    isActive
                      ? "bg-[#171717] text-white shadow-sm"
                      : "text-[#777770] hover:bg-[#f1f1ed] hover:text-[#171717]"
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      <div aria-hidden="true" className="h-[58px]" />

      {children}
    </div>
  );
}
