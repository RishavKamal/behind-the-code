"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { createClient } from "@/components/lib/supabase/client";

const navigation = [
  { name: "Home", href: "/" },
  { name: "Articles", href: "/articles" },
  { name: "Topics", href: "/topics" },
  { name: "About", href: "/about" },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();

  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [userId, setUserId] = useState("");

  const profileRef = useRef<HTMLDivElement>(null);

  /*
   * Load the profile stored in public.profiles.
   *
   * This is the source of truth for:
   * - display_name
   * - username
   * - avatar_url
   */
  async function loadProfile(profileUserId: string) {
    if (!profileUserId) {
      return;
    }

    const supabase = createClient();

    const { data, error } = await supabase
      .from("profiles")
      .select("display_name, username, avatar_url")
      .eq("id", profileUserId)
      .maybeSingle();

    if (error) {
      console.error("Header profile error:", error);
      return;
    }

    if (!data) {
      return;
    }

    const profileName =
      data.display_name?.trim() ||
      data.username?.trim() ||
      "";

    setUserName(profileName);
    setAvatarUrl(data.avatar_url ?? "");
  }

  /*
   * Authentication + profile loading.
   */
  useEffect(() => {
    const supabase = createClient();

    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setIsLoggedIn(false);
        setUserId("");
        setUserEmail("");
        setUserName("");
        setAvatarUrl("");
        setCheckingAuth(false);
        return;
      }

      setIsLoggedIn(true);
      setUserId(user.id);
      setUserEmail(user.email ?? "");

      /*
       * First use auth metadata as a temporary fallback.
       * The profiles table will then overwrite it when available.
       */
      const metadata = user.user_metadata;

      const metadataName =
        metadata?.full_name ||
        metadata?.name ||
        metadata?.display_name ||
        "";

      setUserName(metadataName);

      await loadProfile(user.id);

      setCheckingAuth(false);
    };

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const user = session?.user;

        if (!user) {
          setIsLoggedIn(false);
          setUserId("");
          setUserEmail("");
          setUserName("");
          setAvatarUrl("");
          setCheckingAuth(false);
          return;
        }

        setIsLoggedIn(true);
        setUserId(user.id);
        setUserEmail(user.email ?? "");

        const metadata = user.user_metadata;

        const metadataName =
          metadata?.full_name ||
          metadata?.name ||
          metadata?.display_name ||
          "";

        setUserName(metadataName);

        /*
         * Load the actual profile data.
         */
        void loadProfile(user.id);

        setCheckingAuth(false);
      },
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /*
   * Reload the profile when navigating between pages.
   *
   * This matters because Header is part of the persistent AppShell.
   * If the user changes their avatar in Settings and then navigates
   * to another page, the Header should pick up the new avatar.
   */
  useEffect(() => {
    if (userId && isLoggedIn) {
      void loadProfile(userId);
    }
  }, [pathname, userId, isLoggedIn]);

  /*
   * Close profile dropdown when clicking outside.
   */
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setProfileOpen(false);
      }
    }

    if (profileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileOpen]);

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }

    return (
      pathname === href ||
      pathname.startsWith(`${href}/`)
    );
  };

  const getInitials = () => {
    if (userName.trim()) {
      const parts = userName
        .trim()
        .split(/\s+/)
        .filter(Boolean);

      if (parts.length >= 2) {
        return (
          parts[0][0] + parts[parts.length - 1][0]
        ).toUpperCase();
      }

      return parts[0][0].toUpperCase();
    }

    if (userEmail) {
      return userEmail[0].toUpperCase();
    }

    return "U";
  };

  const displayName =
    userName || userEmail.split("@")[0] || "Account";

  async function handleSignOut() {
    setProfileOpen(false);
    setMenuOpen(false);

    const supabase = createClient();

    await supabase.auth.signOut();

    setIsLoggedIn(false);
    setUserId("");
    setUserEmail("");
    setUserName("");
    setAvatarUrl("");

    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[#deded9] bg-[#fafaf8]/95 backdrop-blur-sm">
      <style jsx>{`
        @keyframes profileDropdownIn {
          from {
            opacity: 0;
            transform: translateY(-6px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .profile-dropdown {
          transform-origin: top right;
          animation: profileDropdownIn 160ms ease-out;
        }
      `}</style>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        {/* Logo */}
        <Link
          href="/"
          onClick={() => {
            setMenuOpen(false);
            setProfileOpen(false);
          }}
          className="flex items-center gap-3.5"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#171717] text-[10px] font-bold tracking-tight text-white">
            BT
          </span>

          <span className="text-[15px] font-semibold tracking-[-0.02em] text-[#171717]">
            Behind the Code
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          {navigation.map((item) => {
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-md px-3 py-2 text-sm transition-colors ${
                  active
                    ? "font-medium text-[#171717]"
                    : "text-[#777771] hover:bg-[#f1f1ee] hover:text-[#171717]"
                }`}
              >
                {item.name}
              </Link>
            );
          })}

          <div className="ml-3 h-5 w-px bg-[#deded9]" />

          {!checkingAuth && (
            <>
              {isLoggedIn ? (
                <div
                  ref={profileRef}
                  className="relative ml-3"
                >
                  {/* Profile Button */}
                  <button
                    type="button"
                    onClick={() =>
                      setProfileOpen(
                        (current) => !current,
                      )
                    }
                    aria-haspopup="menu"
                    aria-expanded={profileOpen}
                    className={`group flex items-center gap-2 rounded-xl border px-2 py-1.5 transition-all duration-200 ${
                      profileOpen
                        ? "border-[#d2d2cc] bg-[#f3f3f0] shadow-sm"
                        : "border-transparent hover:border-[#deded9] hover:bg-[#f6f6f3]"
                    }`}
                  >
                    {avatarUrl ? (
                      <Image
                        src={avatarUrl}
                        alt={`${displayName} avatar`}
                        width={32}
                        height={32}
                        unoptimized
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#171717] text-[11px] font-semibold text-white">
                        {getInitials()}
                      </span>
                    )}

                    <span className="hidden max-w-28 truncate text-sm font-medium text-[#333330] lg:block">
                      {displayName}
                    </span>

                    <ChevronDownIcon
                      open={profileOpen}
                    />
                  </button>

                  {/* Profile Dropdown */}
                  {profileOpen && (
                    <div
                      role="menu"
                      className="profile-dropdown absolute right-0 top-[calc(100%+10px)] w-[270px] overflow-hidden rounded-2xl border border-[#deded9] bg-white shadow-[0_18px_55px_rgba(20,20,20,0.12)]"
                    >
                      {/* Account Info */}
                      <div className="border-b border-[#deded9] bg-[#fafaf8] px-4 py-4">
                        <div className="flex items-center gap-3">
                          {avatarUrl ? (
                            <Image
                              src={avatarUrl}
                              alt={`${displayName} avatar`}
                              width={40}
                              height={40}
                              unoptimized
                              className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-[#deded9]"
                            />
                          ) : (
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#171717] text-xs font-semibold text-white">
                              {getInitials()}
                            </span>
                          )}

                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-[#171717]">
                              {displayName}
                            </p>

                            {userEmail && (
                              <p className="mt-0.5 truncate text-xs text-[#999992]">
                                {userEmail}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Account Links */}
                      <div className="space-y-0.5 p-2.5">
                        <ProfileMenuItem
                          href="/profile"
                          icon={<UserIcon />}
                          label="Profile"
                          onClick={() =>
                            setProfileOpen(false)
                          }
                        />

                        <ProfileMenuItem
                          href="/dashboard"
                          icon={<DashboardIcon />}
                          label="Dashboard"
                          onClick={() =>
                            setProfileOpen(false)
                          }
                        />

                        <ProfileMenuItem
                          href="/dashboard/articles"
                          icon={<ArticleIcon />}
                          label="My Articles"
                          onClick={() =>
                            setProfileOpen(false)
                          }
                        />

                        <ProfileMenuItem
                          href="/settings"
                          icon={<SettingsIcon />}
                          label="Settings"
                          onClick={() =>
                            setProfileOpen(false)
                          }
                        />
                      </div>

                      {/* Sign Out */}
                      <div className="border-t border-[#deded9] p-2.5">
                        <button
                          type="button"
                          role="menuitem"
                          onClick={handleSignOut}
                          className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#777771] transition-all duration-200 hover:bg-[#f8f8f6] hover:text-[#9a4d4d]"
                        >
                          <LogoutIcon />

                          <span>Sign out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="ml-3 rounded-lg border border-[#d3d3ce] bg-white px-4 py-2 text-sm font-medium text-[#333330] transition-colors hover:border-[#aaa9a3] hover:bg-[#f8f8f6]"
                  >
                    Login
                  </Link>

                  <Link
                    href="/register"
                    className="ml-1 rounded-lg bg-[#171717] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#303030]"
                  >
                    Get started
                  </Link>
                </>
              )}
            </>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() => {
            setMenuOpen((current) => !current);
            setProfileOpen(false);
          }}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[#555550] transition-colors hover:bg-[#f1f1ee] hover:text-[#171717] md:hidden"
          aria-label={
            menuOpen ? "Close menu" : "Open menu"
          }
          aria-expanded={menuOpen}
        >
          {menuOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {menuOpen && (
        <div className="border-t border-[#deded9] bg-[#fafaf8] md:hidden">
          <nav className="mx-auto max-w-6xl px-6 py-4">
            <div className="space-y-1">
              {navigation.map((item) => {
                const active = isActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={`block rounded-lg px-3 py-2.5 text-sm transition-colors ${
                      active
                        ? "bg-[#f1f1ee] font-medium text-[#171717]"
                        : "text-[#777771] hover:bg-[#f1f1ee] hover:text-[#171717]"
                    }`}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </div>

            {!checkingAuth && (
              <div className="mt-4 border-t border-[#deded9] pt-4">
                {isLoggedIn ? (
                  <div className="overflow-hidden rounded-xl border border-[#deded9] bg-white">
                    {/* Mobile Account Header */}
                    <div className="flex items-center gap-3 px-4 py-4">
                      {avatarUrl ? (
                        <Image
                          src={avatarUrl}
                          alt={`${displayName} avatar`}
                          width={36}
                          height={36}
                          unoptimized
                          className="h-9 w-9 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#171717] text-xs font-semibold text-white">
                          {getInitials()}
                        </span>
                      )}

                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[#171717]">
                          {displayName}
                        </p>

                        {userEmail && (
                          <p className="truncate text-xs text-[#999992]">
                            {userEmail}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="border-t border-[#deded9] p-2">
                      <ProfileMenuItem
                        href="/profile"
                        icon={<UserIcon />}
                        label="Profile"
                        onClick={() =>
                          setMenuOpen(false)
                        }
                      />

                      <ProfileMenuItem
                        href="/dashboard"
                        icon={<DashboardIcon />}
                        label="Dashboard"
                        onClick={() =>
                          setMenuOpen(false)
                        }
                      />

                      <ProfileMenuItem
                        href="/dashboard/articles"
                        icon={<ArticleIcon />}
                        label="My Articles"
                        onClick={() =>
                          setMenuOpen(false)
                        }
                      />

                      <ProfileMenuItem
                        href="/settings"
                        icon={<SettingsIcon />}
                        label="Settings"
                        onClick={() =>
                          setMenuOpen(false)
                        }
                      />
                    </div>

                    <div className="border-t border-[#deded9] p-2">
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[#777771] transition-colors hover:bg-[#f8f8f6] hover:text-[#9a4d4d]"
                      >
                        <LogoutIcon />

                        <span>Sign out</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href="/login"
                      onClick={() => setMenuOpen(false)}
                      className="rounded-lg border border-[#d3d3ce] bg-white px-4 py-2.5 text-center text-sm font-medium text-[#333330] transition-colors hover:border-[#aaa9a3] hover:bg-[#f8f8f6]"
                    >
                      Login
                    </Link>

                    <Link
                      href="/register"
                      onClick={() => setMenuOpen(false)}
                      className="rounded-lg bg-[#171717] px-4 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-[#303030]"
                    >
                      Get started
                    </Link>
                  </div>
                )}
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

function ProfileMenuItem({
  href,
  icon,
  label,
  onClick,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onClick}
      className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#555550] transition-all duration-200 hover:bg-[#f4f4f1] hover:text-[#171717]"
    >
      <span className="flex h-4 w-4 items-center justify-center text-[#999992] transition-colors group-hover:text-[#171717]">
        {icon}
      </span>

      <span>{label}</span>
    </Link>
  );
}

function ChevronDownIcon({
  open,
}: {
  open: boolean;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={`h-4 w-4 text-[#777771] transition-transform ${
        open ? "rotate-180" : ""
      }`}
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c.8-3.3 3.2-5 7-5s6.2 1.7 7 5" />
    </svg>
  );
}

function DashboardIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <rect x="4" y="4" width="6" height="6" rx="1" />
      <rect x="14" y="4" width="6" height="6" rx="1" />
      <rect x="4" y="14" width="6" height="6" rx="1" />
      <rect x="14" y="14" width="6" height="6" rx="1" />
    </svg>
  );
}

function ArticleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M6 4h12a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" />
      <path d="M8 8h8" />
      <path d="M8 12h8" />
      <path d="M8 16h5" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 1.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-2.5V20a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1-1.8-1.8.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H6v-2.5h.2a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1 1.8-1.8.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6V4h2.5v.2a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.8 1.8-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v2.5H21a1.7 1.7 0 0 0-1.6 1Z" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M10 5H6a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h4" />
      <path d="M14 8l4 4-4 4" />
      <path d="M18 12H9" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="m6 6 12 12" />
      <path d="m18 6-12 12" />
    </svg>
  );
}