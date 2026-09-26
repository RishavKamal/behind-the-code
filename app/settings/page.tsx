"use client";

import Image from "next/image";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/components/lib/supabase/client";

type Profile = {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  website: string;
  github_url: string;
  linkedin_url: string;
};

export default function SettingsPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");

  const [loading, setLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [deletingAvatar, setDeletingAvatar] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [removeAvatarOpen, setRemoveAvatarOpen] = useState(false);
  const [deleteAccountInput, setDeleteAccountInput] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteAccountError, setDeleteAccountError] = useState("");
  const [activeSection, setActiveSection] = useState("profile");

  const [profileError, setProfileError] = useState("");
  const [profileMessage, setProfileMessage] = useState("");

  const [emailError, setEmailError] = useState("");
  const [emailMessage, setEmailMessage] = useState("");

  const [passwordError, setPasswordError] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      if (userError) {
        console.error("Authentication check error:", userError);
        setProfileError("Unable to verify your session. Please sign in again.");
        setLoading(false);
        setAuthChecking(false);
        return;
      }

      setAuthChecking(false);

      setEmail(user.email ?? "");
      setNewEmail(user.email ?? "");

      const { data: existingProfile, error } = await supabase
        .from("profiles")
        .select(
          "id, username, display_name, bio, avatar_url, website, github_url, linkedin_url",
        )
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Profile load error:", error);
        setProfileError(error.message);
        setLoading(false);
        return;
      }

      if (existingProfile) {
        const metadata = user.user_metadata ?? {};

        const metadataUsername =
          typeof metadata.username === "string"
            ? metadata.username.trim().toLowerCase()
            : "";

        let username = existingProfile.username?.trim().toLowerCase() || "";

        /*
         * If this profile was created before username support was added,
         * recover the username stored in Supabase Auth metadata.
         */
        if (!username && metadataUsername) {
          const { error: usernameUpdateError } = await supabase
            .from("profiles")
            .update({
              username: metadataUsername,
              updated_at: new Date().toISOString(),
            })
            .eq("id", user.id);

          if (usernameUpdateError) {
            console.error(
              "Username profile update error:",
              usernameUpdateError,
            );
          } else {
            username = metadataUsername;
          }
        }

        setProfile({
          id: existingProfile.id,
          username,
          display_name: existingProfile.display_name ?? "",
          bio: existingProfile.bio ?? "",
          avatar_url: existingProfile.avatar_url ?? "",
          website: existingProfile.website ?? "",
          github_url: existingProfile.github_url ?? "",
          linkedin_url: existingProfile.linkedin_url ?? "",
        });

        setLoading(false);
        return;
      }

      /*
       * Existing Auth users may not have a profiles row yet.
       * Create one automatically.
       */
      const metadata = user.user_metadata ?? {};

      const displayName =
        metadata.full_name ||
        metadata.name ||
        user.email?.split("@")[0] ||
        "";

      const metadataUsername =
        typeof metadata.username === "string"
          ? metadata.username.trim().toLowerCase()
          : "";

      let username =
        metadataUsername ||
        user.email?.split("@")[0]?.toLowerCase() ||
        `user_${user.id.slice(0, 8)}`;

      username = username.replace(/[^a-z0-9_]/g, "_");

      if (!username) {
        username = `user_${user.id.slice(0, 8)}`;
      }

      /*
       * Make sure the generated username is not already used.
       */
      const { data: usernameExists } = await supabase
        .from("profiles")
        .select("id")
        .ilike("username", username)
        .neq("id", user.id)
        .maybeSingle();

      if (usernameExists) {
        username = `${username}_${user.id.slice(0, 6)}`;
      }

      const { data: newProfile, error: createError } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          username,
          display_name: displayName,
          bio: "",
          avatar_url: "",
          website: "",
          github_url: "",
          linkedin_url: "",
        })
        .select(
          "id, username, display_name, bio, avatar_url, website, github_url, linkedin_url",
        )
        .single();

      if (createError) {
        console.error("Profile creation error:", createError);
        setProfileError(createError.message);
        setLoading(false);
        return;
      }

      setProfile({
        id: newProfile.id,
        username: newProfile.username ?? "",
        display_name: newProfile.display_name ?? "",
        bio: newProfile.bio ?? "",
        avatar_url: newProfile.avatar_url ?? "",
        website: newProfile.website ?? "",
        github_url: newProfile.github_url ?? "",
        linkedin_url: newProfile.linkedin_url ?? "",
      });

      setLoading(false);
    }

    loadProfile();
  }, [router, supabase]);

  useEffect(() => {
    if (loading) {
      return;
    }

    const sectionIds = [
      "profile",
      "email",
      "password",
      "account-control",
    ];

    let frame = 0;

    const updateActiveSection = () => {
      cancelAnimationFrame(frame);

      frame = requestAnimationFrame(() => {
        const viewportTop = 130;
        const viewportBottom = window.innerHeight;
        let currentId = sectionIds[0];
        let largestVisibleHeight = -1;

        for (const id of sectionIds) {
          const section = document.getElementById(id);

          if (!section) {
            continue;
          }

          const rect = section.getBoundingClientRect();
          const visibleTop = Math.max(rect.top, viewportTop);
          const visibleBottom = Math.min(rect.bottom, viewportBottom);
          const visibleHeight = Math.max(0, visibleBottom - visibleTop);

          if (visibleHeight > largestVisibleHeight) {
            largestVisibleHeight = visibleHeight;
            currentId = id;
          }
        }

        setActiveSection((current) =>
          current === currentId ? current : currentId,
        );
      });
    };

    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
    };
  }, [loading]);

  function handleSectionNavigation(id: string) {
    setActiveSection(id);

    const section = document.getElementById(id);

    if (!section) {
      return;
    }

    const top = section.getBoundingClientRect().top + window.scrollY - 100;

    window.scrollTo({
      top: Math.max(0, top),
      behavior: "smooth",
    });
  }

  function updateProfileField(
    field:
      | "username"
      | "display_name"
      | "bio"
      | "website"
      | "github_url"
      | "linkedin_url",
    value: string,
  ) {
    setProfile((current) =>
      current
        ? {
            ...current,
            [field]: value,
          }
        : current,
    );
  }

  async function handleProfileSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!profile) {
      return;
    }

    setProfileError("");
    setProfileMessage("");

    const username = profile.username.trim().toLowerCase();
    const displayName = profile.display_name.trim();

    if (!displayName) {
      setProfileError("Display name cannot be empty.");
      return;
    }

    if (!username) {
      setProfileError("Username cannot be empty.");
      return;
    }

    if (
      !/^[a-z0-9_]+$/.test(username) ||
      username.length < 3 ||
      username.length > 30
    ) {
      setProfileError(
        "Username must be 3–30 characters and use only lowercase letters, numbers, and underscores.",
      );
      return;
    }

    setSavingProfile(true);


    const { data: existingUsername, error: usernameError } =
      await supabase
        .from("profiles")
        .select("id")
        .ilike("username", username)
        .neq("id", profile.id)
        .maybeSingle();

    if (usernameError) {
      setSavingProfile(false);
      setProfileError(usernameError.message);
      return;
    }

    if (existingUsername) {
      setSavingProfile(false);
      setProfileError("That username is already taken.");
      return;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        username,
        display_name: displayName,
        bio: profile.bio.trim(),
        website: profile.website.trim(),
        github_url: profile.github_url.trim(),
        linkedin_url: profile.linkedin_url.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id);

    if (updateError) {
      console.error("Profile update error:", updateError);
      setSavingProfile(false);

      if (updateError.code === "23505") {
        setProfileError("That username is already taken.");
      } else {
        setProfileError(updateError.message);
      }

      return;
    }

    const { error: authError } = await supabase.auth.updateUser({
      data: {
        full_name: displayName,
        username,
      },
    });

    if (authError) {
      console.error("Auth metadata update failed:", authError);
    }

    setProfile((current) =>
      current
        ? {
            ...current,
            username,
            display_name: displayName,
          }
        : current,
    );

    setSavingProfile(false);
    setProfileMessage("Profile updated successfully.");
  }

  async function handleAvatarChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    if (!file || !profile) {
      return;
    }

    setProfileError("");
    setProfileMessage("");

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setProfileError("Please upload a JPG, PNG, or WebP image.");
      event.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setProfileError("Avatar must be smaller than 2 MB.");
      event.target.value = "";
      return;
    }

    setUploadingAvatar(true);


    /*
     * The Storage structure is:
     *
     * avatars/
     *   <user-id>/
     *     avatar
     */
    const filePath = `${profile.id}/avatar`;

    /*
     * Check the currently authenticated user.
     */
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser) {
      setUploadingAvatar(false);
      setProfileError("Your session has expired. Please log in again.");
      event.target.value = "";
      return;
    }

    /*
     * The profile ID MUST equal the authenticated user's ID.
     */
    if (currentUser.id !== profile.id) {
      setUploadingAvatar(false);
      setProfileError(
        "Authentication mismatch. Please sign out and sign in again.",
      );
      event.target.value = "";
      return;
    }

    /*
     * Upload the avatar.
     *
     * upsert=true allows replacing an existing avatar.
     */
    const { data: uploadData, error: uploadError } =
      await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type,
        });

    if (uploadError) {
      console.error("Avatar upload error:", uploadError);

      setUploadingAvatar(false);
      setProfileError(uploadError.message);
      event.target.value = "";
      return;
    }

    /*
     * Get the public URL for the uploaded image.
     */
    const {
      data: { publicUrl },
    } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    /*
     * Cache busting ensures the browser doesn't keep showing
     * the previous avatar from cache.
     */
    const avatarUrl = `${publicUrl}?v=${Date.now()}`;

    /*
     * Save the URL in the user's profile.
     */
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id);

    if (updateError) {
      console.error(
        "Avatar profile update error:",
        updateError,
      );

      setUploadingAvatar(false);
      setProfileError(updateError.message);
      event.target.value = "";
      return;
    }

    /*
     * Update the UI immediately.
     */
    setProfile((current) =>
      current
        ? {
            ...current,
            avatar_url: avatarUrl,
          }
        : current,
    );

    setUploadingAvatar(false);
    event.target.value = "";

    setProfileMessage("Profile picture updated successfully.");
  }

  function openAvatarDeleteModal() {
    if (!profile?.avatar_url || uploadingAvatar || deletingAvatar) {
      return;
    }

    setProfileError("");
    setProfileMessage("");
    setRemoveAvatarOpen(true);
  }

  function closeAvatarDeleteModal() {
    if (deletingAvatar) {
      return;
    }

    setRemoveAvatarOpen(false);
  }

  async function handleAvatarDelete() {
    if (!profile?.avatar_url || deletingAvatar) {
      return;
    }

    setProfileError("");
    setProfileMessage("");
    setDeletingAvatar(true);


    /*
     * The actual Storage object path does not contain the cache-busting
     * query string that is stored in profiles.avatar_url.
     */
    const filePath = `${profile.id}/avatar`;

    const { error: deleteError } = await supabase.storage
      .from("avatars")
      .remove([filePath]);

    if (deleteError) {
      console.error("Avatar delete error:", deleteError);
      setDeletingAvatar(false);
      setProfileError(deleteError.message);
      return;
    }

    /*
     * Remove the public URL from the profile record as well.
     */
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        avatar_url: "",
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id);

    if (updateError) {
      console.error(
        "Avatar profile clear error:",
        updateError,
      );
      setDeletingAvatar(false);
      setProfileError(updateError.message);
      return;
    }

    /*
     * Update the Settings page immediately.
     */
    setProfile((current) =>
      current
        ? {
            ...current,
            avatar_url: "",
          }
        : current,
    );

    setDeletingAvatar(false);
    setRemoveAvatarOpen(false);
    setProfileMessage("Profile picture removed successfully.");
  }

  async function handleEmailUpdate(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setEmailError("");
    setEmailMessage("");

    const trimmedEmail = newEmail.trim().toLowerCase();

    if (!trimmedEmail) {
      setEmailError("Email cannot be empty.");
      return;
    }

    if (trimmedEmail === email.toLowerCase()) {
      setEmailMessage("This is already your current email.");
      return;
    }

    setSavingEmail(true);


    const { error } = await supabase.auth.updateUser({
      email: trimmedEmail,
    });

    setSavingEmail(false);

    if (error) {
      setEmailError(error.message);
      return;
    }

    setEmailMessage(
      "A confirmation link has been sent to your new email address.",
    );
  }

  async function handlePasswordUpdate(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setPasswordError("");
    setPasswordMessage("");

    if (newPassword.length < 8) {
      setPasswordError(
        "Password must be at least 8 characters.",
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setSavingPassword(true);


    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    setSavingPassword(false);

    if (error) {
      setPasswordError(error.message);
      return;
    }

    setNewPassword("");
    setConfirmPassword("");
    setPasswordMessage("Password updated successfully.");
  }

  function openDeleteAccountModal() {
    setDeleteAccountInput("");
    setDeleteAccountError("");
    setDeleteAccountOpen(true);
  }

  function closeDeleteAccountModal() {
    if (deletingAccount) {
      return;
    }

    setDeleteAccountOpen(false);
    setDeleteAccountInput("");
    setDeleteAccountError("");
  }

  async function handleDeleteAccount() {
    if (deleteAccountInput.trim() !== "DELETE") {
      setDeleteAccountError('Type "DELETE" exactly to confirm account deletion.');
      return;
    }

    setDeleteAccountError("");
    setDeletingAccount(true);

    try {
      const response = await fetch("/api/account/delete", {
        method: "DELETE",
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        setDeleteAccountError(
          result?.error ||
            "We could not delete your account. Please try again.",
        );
        setDeletingAccount(false);
        return;
      }

  
      /* Clear the local session after the server permanently deletes the user. */
      await supabase.auth.signOut({ scope: "local" });

      router.replace("/login?deleted=1");
      router.refresh();
    } catch (error) {
      console.error("Account deletion request failed:", error);

      setDeleteAccountError(
        "Something went wrong while deleting your account. Please try again.",
      );
      setDeletingAccount(false);
    }
  }

  async function handleSignOut() {
    setSigningOut(true);


    await supabase.auth.signOut();

    router.push("/");
    router.refresh();
  }

  if (authChecking || loading) {
    return (
      <main className="min-h-[calc(100vh-65px)] bg-[#f8f8f5]">
        <div className="mx-auto max-w-6xl px-6 py-12 md:px-8 md:py-16">
          <div className="h-3 w-20 animate-pulse rounded bg-[#deded9]" />
          <div className="mt-4 h-12 w-64 animate-pulse rounded bg-[#e8e8e3]" />

          <div className="mt-12 grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
            <div className="hidden lg:block">
              <div className="h-32 animate-pulse rounded-xl bg-[#eeeeea]" />
            </div>

            <div className="space-y-5">
              <div className="h-80 animate-pulse rounded-2xl border border-[#deded9] bg-white" />
              <div className="h-52 animate-pulse rounded-2xl border border-[#deded9] bg-white" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-[calc(100vh-65px)] bg-[#f8f8f5]">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <div className="rounded-2xl border border-[#deded9] bg-white p-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#3568e8]">
              Account
            </p>
            <h1 className="mt-3 text-2xl font-bold tracking-[-0.04em] text-[#171717]">
              Unable to load settings
            </h1>
            <p className="mt-2 text-sm leading-6 text-[#777771]">
              {profileError || "Something went wrong while loading your profile."}
            </p>
          </div>
        </div>
      </main>
    );
  }

  const initials =
    profile.display_name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "U";

  return (
    <main className="min-h-[calc(100vh-65px)] bg-[#f8f8f5]">
      <div className="mx-auto max-w-6xl px-6 py-10 md:px-8 md:py-14">
        {/* Header */}
        <header className="border-b border-[#deded9] pb-9">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-[#999991] transition-colors hover:text-[#171717]"
          >
            <span aria-hidden="true">←</span>
            Back
          </button>

          <div className="mt-9 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#3568e8]">
                <span>Account</span>
                <span className="h-1 w-1 rounded-full bg-[#3568e8]" />
                <span className="text-[#999991]">Settings</span>
              </div>

              <h1 className="mt-3 text-4xl font-bold tracking-[-0.055em] text-[#171717] sm:text-5xl md:text-6xl">
                Your account.
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-[#777771] md:text-base">
                Keep your profile current, manage how you sign in, and control
                your account.
              </p>
            </div>

            <div className="hidden shrink-0 text-right md:block">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#aaa9a1]">
                Signed in as
              </p>
              <p className="mt-2 max-w-[240px] truncate text-sm font-medium text-[#333330]">
                {email}
              </p>
            </div>
          </div>
        </header>

        <div className="grid gap-10 pt-10 lg:grid-cols-[190px_minmax(0,1fr)] lg:gap-14">
          {/* Settings navigation */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#aaa9a1]">
                On this page
              </p>

              <nav className="relative mt-4 border-l border-[#deded9]">
                {(() => {
                  const items = [
                    ["profile", "Public profile"],
                    ["email", "Email address"],
                    ["password", "Password"],
                    ["account-control", "Account control"],
                  ] as const;

                  const activeIndex = Math.max(
                    0,
                    items.findIndex(([id]) => id === activeSection),
                  );

                  return (
                    <>
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute -left-px top-0 h-9 w-0.5 bg-[#171717] transition-transform duration-300 ease-out"
                        style={{ transform: `translateY(${activeIndex * 36}px)` }}
                      />

                      {items.map(([id, label]) => {
                        const isActive = activeSection === id;

                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => handleSectionNavigation(id)}
                            className={`flex h-9 w-full items-center pl-4 text-left text-xs transition-all duration-300 ease-out ${
                              isActive
                                ? "font-semibold text-[#171717]"
                                : "text-[#999991] hover:translate-x-0.5 hover:text-[#171717]"
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </>
                  );
                })()}
              </nav>
            </div>
          </aside>

          <div className="min-w-0 space-y-8">
            {/* Public profile */}
            <section
              id="profile"
              className="scroll-mt-24 overflow-hidden rounded-2xl border border-[#deded9] bg-white"
            >
              <div className="border-b border-[#e8e8e3] px-6 py-6 md:px-8">
                <div className="flex items-start justify-between gap-5">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.17em] text-[#3568e8]">
                      01 / Profile
                    </p>
                    <h2 className="mt-2 text-xl font-bold tracking-[-0.035em] text-[#171717]">
                      Public profile
                    </h2>
                    <p className="mt-1.5 max-w-xl text-xs leading-5 text-[#777771]">
                      The information readers see when they discover your work.
                    </p>
                  </div>

                  <span className="hidden rounded-full border border-[#e0e0db] px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-[#aaa9a1] sm:inline-flex">
                    Public
                  </span>
                </div>
              </div>

              <form onSubmit={handleProfileSave} className="p-6 md:p-8">
                {/* Avatar */}
                <div className="flex flex-col gap-5 border-b border-[#eeeeea] pb-7 sm:flex-row sm:items-center">
                  {profile.avatar_url ? (
                    <Image
                      src={profile.avatar_url}
                      alt={profile.display_name}
                      width={88}
                      height={88}
                      unoptimized
                      className="h-[88px] w-[88px] rounded-full border border-[#deded9] object-cover"
                    />
                  ) : (
                    <div className="flex h-[88px] w-[88px] shrink-0 items-center justify-center rounded-full bg-[#171717] text-xl font-semibold text-white">
                      {initials}
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#333330]">
                      Profile picture
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[#999991]">
                      JPG, PNG or WebP · maximum 2 MB
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <label className="inline-flex cursor-pointer rounded-lg bg-[#171717] px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#303030]">
                        {uploadingAvatar ? "Uploading..." : "Choose image"}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleAvatarChange}
                          disabled={uploadingAvatar}
                          className="hidden"
                        />
                      </label>

                      {profile.avatar_url && (
                        <button
                          type="button"
                          onClick={openAvatarDeleteModal}
                          disabled={uploadingAvatar || deletingAvatar}
                          className="text-xs font-medium text-[#777771] transition-colors hover:text-[#9a4d4d] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {deletingAvatar ? "Removing..." : "Remove picture"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Name / username */}
                <div className="grid gap-6 pt-7 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="display-name"
                      className="mb-2 block text-[9px] font-bold uppercase tracking-[0.14em] text-[#777771]"
                    >
                      Display name
                    </label>
                    <input
                      id="display-name"
                      type="text"
                      value={profile.display_name}
                      onChange={(event) =>
                        updateProfileField("display_name", event.target.value)
                      }
                      placeholder="Your name"
                      required
                      className="w-full border-0 border-b border-[#d8d8d2] bg-transparent px-0 py-3 text-base font-medium text-[#171717] outline-none transition-colors placeholder:text-[#b1b1aa] focus:border-[#171717]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="username"
                      className="mb-2 block text-[9px] font-bold uppercase tracking-[0.14em] text-[#777771]"
                    >
                      Username
                    </label>

                    <div className="flex items-center border-b border-[#d8d8d2] focus-within:border-[#171717]">
                      <span className="pr-2 text-sm text-[#aaa9a1]">@</span>
                      <input
                        id="username"
                        type="text"
                        value={profile.username}
                        onChange={(event) =>
                          updateProfileField(
                            "username",
                            event.target.value
                              .toLowerCase()
                              .replace(/\s/g, "_"),
                          )
                        }
                        placeholder="username"
                        required
                        className="min-w-0 flex-1 border-0 bg-transparent px-0 py-3 text-base font-medium text-[#171717] outline-none placeholder:text-[#b1b1aa]"
                      />
                    </div>

                    <p className="mt-2 text-[10px] leading-5 text-[#aaa9a1]">
                      Lowercase letters, numbers and underscores only.
                    </p>
                  </div>
                </div>

                {/* Bio */}
                <div className="pt-7">
                  <div className="flex items-center justify-between gap-4">
                    <label
                      htmlFor="bio"
                      className="block text-[9px] font-bold uppercase tracking-[0.14em] text-[#777771]"
                    >
                      Bio
                    </label>
                    <span className="text-[10px] text-[#aaa9a1]">
                      {profile.bio.length}/300
                    </span>
                  </div>

                  <textarea
                    id="bio"
                    value={profile.bio}
                    onChange={(event) =>
                      updateProfileField("bio", event.target.value)
                    }
                    placeholder="Tell readers a little about yourself."
                    rows={4}
                    maxLength={300}
                    className="mt-2 w-full resize-none border-b border-[#d8d8d2] bg-transparent px-0 py-3 text-sm leading-6 text-[#171717] outline-none transition-colors placeholder:text-[#b1b1aa] focus:border-[#171717]"
                  />
                </div>

                {/* Links */}
                <div className="pt-7">
                  <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#777771]">
                    Links
                  </p>

                  <div className="mt-3 grid gap-x-6 gap-y-4 sm:grid-cols-3">
                    <input
                      type="url"
                      value={profile.website}
                      onChange={(event) =>
                        updateProfileField("website", event.target.value)
                      }
                      placeholder="Website"
                      className="w-full border-b border-[#d8d8d2] bg-transparent px-0 py-3 text-sm text-[#171717] outline-none transition-colors placeholder:text-[#aaa9a1] focus:border-[#171717]"
                    />
                    <input
                      type="url"
                      value={profile.github_url}
                      onChange={(event) =>
                        updateProfileField("github_url", event.target.value)
                      }
                      placeholder="GitHub"
                      className="w-full border-b border-[#d8d8d2] bg-transparent px-0 py-3 text-sm text-[#171717] outline-none transition-colors placeholder:text-[#aaa9a1] focus:border-[#171717]"
                    />
                    <input
                      type="url"
                      value={profile.linkedin_url}
                      onChange={(event) =>
                        updateProfileField("linkedin_url", event.target.value)
                      }
                      placeholder="LinkedIn"
                      className="w-full border-b border-[#d8d8d2] bg-transparent px-0 py-3 text-sm text-[#171717] outline-none transition-colors placeholder:text-[#aaa9a1] focus:border-[#171717]"
                    />
                  </div>
                </div>

                {profileError && (
                  <div className="mt-7 rounded-xl border border-[#e5c9c9] bg-[#fff8f8] px-4 py-3 text-xs leading-5 text-[#8d4545]">
                    {profileError}
                  </div>
                )}

                {profileMessage && (
                  <div className="mt-7 rounded-xl border border-[#d8ddd8] bg-[#f7faf7] px-4 py-3 text-xs leading-5 text-[#527052]">
                    {profileMessage}
                  </div>
                )}

                <div className="mt-7 flex justify-end border-t border-[#eeeeea] pt-6">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="rounded-lg bg-[#171717] px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#303030] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingProfile ? "Saving..." : "Save profile"}
                  </button>
                </div>
              </form>
            </section>

            {/* Email */}
            <section
              id="email"
              className="scroll-mt-24 overflow-hidden rounded-2xl border border-[#deded9] bg-white"
            >
              <div className="border-b border-[#e8e8e3] px-6 py-6 md:px-8">
                <p className="text-[9px] font-bold uppercase tracking-[0.17em] text-[#3568e8]">
                  02 / Sign-in
                </p>
                <h2 className="mt-2 text-xl font-bold tracking-[-0.035em] text-[#171717]">
                  Email address
                </h2>
                <p className="mt-1.5 text-xs leading-5 text-[#777771]">
                  Used for signing in and account notifications.
                </p>
              </div>

              <form onSubmit={handleEmailUpdate} className="p-6 md:p-8">
                <label
                  htmlFor="email"
                  className="mb-2 block text-[9px] font-bold uppercase tracking-[0.14em] text-[#777771]"
                >
                  Email
                </label>

                <input
                  id="email"
                  type="email"
                  value={newEmail}
                  onChange={(event) => setNewEmail(event.target.value)}
                  required
                  className="w-full max-w-2xl border-b border-[#d8d8d2] bg-transparent px-0 py-3 text-base text-[#171717] outline-none transition-colors focus:border-[#171717]"
                />

                {emailError && (
                  <div className="mt-5 rounded-xl border border-[#e5c9c9] bg-[#fff8f8] px-4 py-3 text-xs text-[#8d4545]">
                    {emailError}
                  </div>
                )}

                {emailMessage && (
                  <div className="mt-5 rounded-xl border border-[#d8ddd8] bg-[#f7faf7] px-4 py-3 text-xs text-[#527052]">
                    {emailMessage}
                  </div>
                )}

                <div className="mt-6 flex justify-end">
                  <button
                    type="submit"
                    disabled={savingEmail}
                    className="rounded-lg border border-[#d5d5cf] bg-white px-5 py-2.5 text-xs font-semibold text-[#333330] transition-colors hover:border-[#aaa9a1] hover:bg-[#f8f8f5] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingEmail ? "Updating..." : "Update email"}
                  </button>
                </div>
              </form>
            </section>

            {/* Password */}
            <section
              id="password"
              className="scroll-mt-24 overflow-hidden rounded-2xl border border-[#deded9] bg-white"
            >
              <div className="border-b border-[#e8e8e3] px-6 py-6 md:px-8">
                <p className="text-[9px] font-bold uppercase tracking-[0.17em] text-[#3568e8]">
                  03 / Security
                </p>
                <h2 className="mt-2 text-xl font-bold tracking-[-0.035em] text-[#171717]">
                  Password
                </h2>
                <p className="mt-1.5 text-xs leading-5 text-[#777771]">
                  Change the password used to sign in to your account.
                </p>
              </div>

              <form onSubmit={handlePasswordUpdate} className="p-6 md:p-8">
                <div className="grid max-w-2xl gap-6 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="new-password"
                      className="mb-2 block text-[9px] font-bold uppercase tracking-[0.14em] text-[#777771]"
                    >
                      New password
                    </label>
                    <input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      placeholder="At least 8 characters"
                      minLength={8}
                      required
                      className="w-full border-b border-[#d8d8d2] bg-transparent px-0 py-3 text-sm text-[#171717] outline-none transition-colors placeholder:text-[#aaa9a1] focus:border-[#171717]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="confirm-password"
                      className="mb-2 block text-[9px] font-bold uppercase tracking-[0.14em] text-[#777771]"
                    >
                      Confirm password
                    </label>
                    <input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(event) =>
                        setConfirmPassword(event.target.value)
                      }
                      placeholder="Repeat your password"
                      minLength={8}
                      required
                      className="w-full border-b border-[#d8d8d2] bg-transparent px-0 py-3 text-sm text-[#171717] outline-none transition-colors placeholder:text-[#aaa9a1] focus:border-[#171717]"
                    />
                  </div>
                </div>

                {passwordError && (
                  <div className="mt-5 rounded-xl border border-[#e5c9c9] bg-[#fff8f8] px-4 py-3 text-xs text-[#8d4545]">
                    {passwordError}
                  </div>
                )}

                {passwordMessage && (
                  <div className="mt-5 rounded-xl border border-[#d8ddd8] bg-[#f7faf7] px-4 py-3 text-xs text-[#527052]">
                    {passwordMessage}
                  </div>
                )}

                <div className="mt-6 flex justify-end">
                  <button
                    type="submit"
                    disabled={savingPassword}
                    className="rounded-lg border border-[#d5d5cf] bg-white px-5 py-2.5 text-xs font-semibold text-[#333330] transition-colors hover:border-[#aaa9a1] hover:bg-[#f8f8f5] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingPassword ? "Updating..." : "Update password"}
                  </button>
                </div>
              </form>
            </section>

            {/* Account control */}
            <section
              id="account-control"
              className="scroll-mt-24 overflow-hidden rounded-2xl border border-[#deded9] bg-white"
            >
              <div className="border-b border-[#e8e8e3] px-6 py-6 md:px-8">
                <p className="text-[9px] font-bold uppercase tracking-[0.17em] text-[#3568e8]">
                  04 / Account
                </p>
                <h2 className="mt-2 text-xl font-bold tracking-[-0.035em] text-[#171717]">
                  Account control
                </h2>
                <p className="mt-1.5 text-xs leading-5 text-[#777771]">
                  Manage your active session or permanently remove your account.
                </p>
              </div>

              <div className="divide-y divide-[#eeeeea]">
                <div className="flex flex-col gap-5 px-6 py-6 sm:flex-row sm:items-center sm:justify-between md:px-8">
                  <div>
                    <h3 className="text-sm font-semibold text-[#333330]">
                      Sign out
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-[#999991]">
                      Sign out from this account on this device.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleSignOut}
                    disabled={signingOut}
                    className="shrink-0 rounded-lg border border-[#d5d5cf] bg-white px-5 py-2.5 text-xs font-semibold text-[#333330] transition-colors hover:border-[#aaa9a1] hover:bg-[#f8f8f5] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {signingOut ? "Signing out..." : "Sign out"}
                  </button>
                </div>

                <div className="bg-[#fffafa] px-6 py-6 md:px-8">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#9a4d4d]">
                        Permanent action
                      </p>
                      <h3 className="mt-2 text-sm font-semibold text-[#333330]">
                        Delete account
                      </h3>
                      <p className="mt-1 max-w-xl text-xs leading-5 text-[#8a7777]">
                        Permanently removes your profile, published articles,
                        drafts, and profile picture.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={openDeleteAccountModal}
                      className="shrink-0 rounded-lg border border-[#dfbcbc] bg-white px-5 py-2.5 text-xs font-semibold text-[#9a4d4d] transition-colors hover:border-[#c99595] hover:bg-[#fff5f5]"
                    >
                      Delete account
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Remove avatar confirmation modal */}
      {removeAvatarOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#171717]/45 px-5 py-8 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="remove-avatar-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deletingAvatar) {
              closeAvatarDeleteModal();
            }
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-[#deded9] bg-white p-6 shadow-[0_24px_70px_rgba(0,0,0,0.18)] md:p-7">
            <p className="text-[9px] font-bold uppercase tracking-[0.17em] text-[#777771]">
              Profile picture
            </p>

            <h2
              id="remove-avatar-title"
              className="mt-3 text-2xl font-bold tracking-[-0.04em] text-[#171717]"
            >
              Remove your picture?
            </h2>

            <p className="mt-3 text-sm leading-6 text-[#777771]">
              Your current profile picture will be removed. You can upload a
              new one later.
            </p>

            <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeAvatarDeleteModal}
                disabled={deletingAvatar}
                className="rounded-lg border border-[#d5d5cf] bg-white px-5 py-2.5 text-xs font-semibold text-[#555550] transition-colors hover:bg-[#f8f8f5] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleAvatarDelete}
                disabled={deletingAvatar}
                className="rounded-lg bg-[#171717] px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#303030] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deletingAvatar ? "Removing..." : "Remove picture"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete account confirmation modal */}
      {deleteAccountOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#171717]/45 px-5 py-8 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-account-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-[#deded9] bg-white p-6 shadow-[0_24px_70px_rgba(0,0,0,0.18)] md:p-7">
            <p className="text-[9px] font-bold uppercase tracking-[0.17em] text-[#9a4d4d]">
              Permanent action
            </p>

            <h2
              id="delete-account-title"
              className="mt-3 text-2xl font-bold tracking-[-0.04em] text-[#171717]"
            >
              Delete your account?
            </h2>

            <p className="mt-3 text-sm leading-6 text-[#777771]">
              This permanently deletes your account, profile, articles, drafts,
              and profile picture. There is no undo.
            </p>

            <label
              htmlFor="delete-account-confirmation"
              className="mt-7 block text-[9px] font-bold uppercase tracking-[0.14em] text-[#555550]"
            >
              Type DELETE to confirm
            </label>

            <input
              id="delete-account-confirmation"
              type="text"
              value={deleteAccountInput}
              onChange={(event) => setDeleteAccountInput(event.target.value)}
              disabled={deletingAccount}
              autoComplete="off"
              autoFocus
              placeholder="DELETE"
              className="mt-2 w-full rounded-lg border border-[#d8d8d2] bg-[#fdfdfb] px-4 py-3 text-sm font-medium text-[#171717] outline-none transition-colors focus:border-[#9a4d4d] focus:bg-white"
            />

            {deleteAccountError && (
              <div className="mt-4 rounded-xl border border-[#e5c9c9] bg-[#fff8f8] px-4 py-3 text-xs leading-5 text-[#8d4545]">
                {deleteAccountError}
              </div>
            )}

            <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeDeleteAccountModal}
                disabled={deletingAccount}
                className="rounded-lg border border-[#d5d5cf] bg-white px-5 py-2.5 text-xs font-semibold text-[#555550] transition-colors hover:bg-[#f8f8f5] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={
                  deletingAccount ||
                  deleteAccountInput.trim() !== "DELETE"
                }
                className="rounded-lg bg-[#9a4d4d] px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#833b3b] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deletingAccount ? "Deleting account..." : "Delete account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
