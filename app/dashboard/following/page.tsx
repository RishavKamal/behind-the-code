"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { createClient } from "@/components/lib/supabase/client";
import ScrollReveal from "@/components/scroll-reveal";

type FollowRow = {
  following_id: string;
  created_at: string;
};

type Profile = {
  id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
};

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(dateString));
}

function getInitials(profile: Profile) {
  const name = profile.display_name?.trim() || profile.username?.trim() || "Developer";

  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default function FollowingPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [following, setFollowing] = useState<FollowRow[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadFollowing() {
      setLoading(true);
      setError("");

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          router.replace(
            `/login?redirectTo=${encodeURIComponent("/dashboard/following")}`,
          );
          return;
        }

        const { data: followData, error: followError } = await supabase
          .from("follows")
          .select("following_id, created_at")
          .eq("follower_id", user.id)
          .order("created_at", { ascending: false });

        if (followError) {
          throw followError;
        }

        const followRows = (followData ?? []) as FollowRow[];
        const profileIds = followRows.map((row) => row.following_id);

        if (profileIds.length === 0) {
          if (!cancelled) {
            setFollowing([]);
            setProfiles([]);
            setLoading(false);
          }
          return;
        }

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("id, display_name, username, avatar_url, bio")
          .in("id", profileIds);

        if (profileError) {
          throw profileError;
        }

        if (!cancelled) {
          setFollowing(followRows);
          setProfiles((profileData ?? []) as Profile[]);
          setLoading(false);
        }
      } catch (loadError) {
        console.error("Following page loading error:", loadError);

        if (!cancelled) {
          setError("Unable to load the developers you follow.");
          setLoading(false);
        }
      }
    }

    void loadFollowing();

    return () => {
      cancelled = true;
    };
  }, [router, supabase]);

  async function unfollow(profileId: string) {
    if (removingId) {
      return;
    }

    setRemovingId(profileId);
    setError("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace(
          `/login?redirectTo=${encodeURIComponent("/dashboard/following")}`,
        );
        return;
      }

      const { error: deleteError } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", profileId);

      if (deleteError) {
        throw deleteError;
      }

      setFollowing((current) =>
        current.filter((row) => row.following_id !== profileId),
      );
      setProfiles((current) =>
        current.filter((profile) => profile.id !== profileId),
      );
    } catch (removeError) {
      console.error("Unfollow error:", removeError);
      setError("Unable to unfollow this developer. Please try again.");
    } finally {
      setRemovingId(null);
    }
  }

  const profileMap = useMemo(
    () => new Map(profiles.map((profile) => [profile.id, profile])),
    [profiles],
  );

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f4f4f0]">
        <div className="mx-auto max-w-[1180px] px-5 py-10 sm:px-8 lg:px-10">
          <div className="animate-pulse">
            <div className="h-3 w-24 rounded bg-[#deded9]" />
            <div className="mt-5 h-12 w-64 rounded bg-[#deded9]" />
            <div className="mt-4 h-4 w-[520px] max-w-full rounded bg-[#e7e7e2]" />
            <div className="mt-10 grid gap-4 md:grid-cols-2">
              <div className="h-52 rounded-2xl bg-white" />
              <div className="h-52 rounded-2xl bg-white" />
              <div className="h-52 rounded-2xl bg-white" />
              <div className="h-52 rounded-2xl bg-white" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f4f4f0] text-[#171717]">
      <ScrollReveal distance={16}>
        <section className="border-b border-[#deded9] bg-[#f8f8f5]">
          <div className="mx-auto max-w-[1180px] px-5 py-12 sm:px-8 lg:px-10 lg:py-16">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#3568e8]">
            Your network
          </p>

          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-[-0.05em] text-[#171717] sm:text-5xl">
                Following.
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-[#777771] sm:text-base">
                Developers whose work you have chosen to follow.
              </p>
            </div>

            <div className="shrink-0 rounded-full border border-[#deded9] bg-white px-4 py-2 text-xs font-medium text-[#777771]">
              {following.length} {following.length === 1 ? "developer" : "developers"}
            </div>
          </div>
          </div>
        </section>
      </ScrollReveal>

      <section className="mx-auto max-w-[1180px] px-5 py-10 sm:px-8 lg:px-10 lg:py-14">
        {error && (
          <ScrollReveal distance={12}>
            <div className="mb-6 rounded-xl border border-[#e4caca] bg-[#fff8f8] px-4 py-3 text-sm text-[#8b4444]">
              {error}
            </div>
          </ScrollReveal>
        )}

        {following.length === 0 ? (
          <ScrollReveal distance={22}>
            <div className="rounded-2xl border border-[#deded9] bg-white px-6 py-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[#deded9] bg-[#f8f8f5]">
              <UsersIcon />
            </div>

            <h2 className="mt-5 text-xl font-semibold tracking-[-0.02em]">
              You are not following anyone yet.
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#777771]">
              Find developers whose articles you enjoy and follow them to build your feed.
            </p>

            <Link
              href="/articles"
              className="mt-6 inline-flex rounded-xl bg-[#171717] px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-[#303030]"
            >
              Discover developers
            </Link>
            </div>
          </ScrollReveal>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {following.map((row, index) => {
              const profile = profileMap.get(row.following_id);

              if (!profile) {
                return null;
              }

              const displayName =
                profile.display_name?.trim() ||
                profile.username?.trim() ||
                "Developer";

              const username = profile.username?.trim();
              const profileHref = username
                ? `/profile/${encodeURIComponent(username)}`
                : "/profile";

              return (
                <ScrollReveal
                  key={profile.id}
                  delay={Math.min(index * 70, 350)}
                  distance={18}
                >
                  <article
                  className="rounded-2xl border border-[#deded9] bg-white p-6 transition-shadow hover:shadow-[0_12px_30px_rgba(20,20,20,0.04)]"
                >
                  <div className="flex items-start gap-4">
                    {profile.avatar_url ? (
                      <Image
                        src={profile.avatar_url}
                        alt={displayName}
                        width={56}
                        height={56}
                        unoptimized
                        className="h-14 w-14 shrink-0 rounded-full border border-[#deded9] object-cover"
                      />
                    ) : (
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-[#deded9] bg-[#f8f8f5] text-sm font-semibold text-[#555550]">
                        {getInitials(profile)}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <Link
                        href={profileHref}
                        className="text-lg font-semibold tracking-[-0.025em] transition-colors hover:text-[#3568e8]"
                      >
                        {displayName}
                      </Link>

                      {username && (
                        <p className="mt-0.5 text-xs text-[#999992]">@{username}</p>
                      )}
                    </div>
                  </div>

                  <p className="mt-5 min-h-[48px] text-sm leading-6 text-[#777771]">
                    {profile.bio?.trim() || "Developer on Behind the Code."}
                  </p>

                  <div className="mt-6 flex flex-col gap-3 border-t border-[#eeeeea] pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#999992]">
                      Following since {formatDate(row.created_at)}
                    </p>

                    <div className="flex items-center gap-2">
                      <Link
                        href={profileHref}
                        className="rounded-xl border border-[#deded9] bg-white px-3.5 py-2 text-xs font-medium text-[#555550] transition-colors hover:border-[#bdbdb7] hover:bg-[#f8f8f5] hover:text-[#171717]"
                      >
                        View profile
                      </Link>

                      <button
                        type="button"
                        onClick={() => void unfollow(profile.id)}
                        disabled={removingId === profile.id}
                        className="rounded-xl bg-[#171717] px-3.5 py-2 text-xs font-medium text-white transition-colors hover:bg-[#303030] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {removingId === profile.id ? "Removing..." : "Following"}
                      </button>
                    </div>
                  </div>
                  </article>
                </ScrollReveal>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

function UsersIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      className="h-5 w-5 text-[#555550]"
      aria-hidden="true"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
