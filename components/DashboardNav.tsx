"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const dashboardNavigation = [
  {
    name: "Overview",
    href: "/dashboard",
  },
  {
    name: "My Articles",
    href: "/dashboard/articles",
  },
  {
    name: "New Article",
    href: "/dashboard/articles/new",
  },
];

export default function DashboardNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    // Overview should only be active on the dashboard home page
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }

    // New Article must be checked before My Articles
    if (href === "/dashboard/articles/new") {
      return pathname === "/dashboard/articles/new";
    }

    // My Articles is active for the articles page
    // and article-specific pages such as /dashboard/articles/123/edit
    if (href === "/dashboard/articles") {
      return (
        pathname === "/dashboard/articles" ||
        (pathname.startsWith("/dashboard/articles/") &&
          !pathname.startsWith("/dashboard/articles/new"))
      );
    }

    return pathname === href;
  };

  return (
    <div className="border-b border-[#deded9] bg-[#fafaf8]">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex min-h-14 items-center justify-between gap-6">
          {/* Dashboard Label */}
          <Link
            href="/dashboard"
            className="shrink-0 text-sm font-semibold tracking-[-0.01em] text-[#171717]"
          >
            Dashboard
          </Link>

          {/* Dashboard Navigation */}
          <nav className="flex items-center gap-1 overflow-x-auto">
            {dashboardNavigation.map((item) => {
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`whitespace-nowrap rounded-md px-3 py-2 text-sm transition-colors ${
                    active
                      ? "bg-white font-medium text-[#171717] shadow-sm"
                      : "text-[#777771] hover:bg-white hover:text-[#171717]"
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}