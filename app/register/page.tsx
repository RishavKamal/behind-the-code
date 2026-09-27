"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

import { createClient } from "@/components/lib/supabase/client";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<
    "idle" | "checking" | "available" | "taken" | "invalid" | "error"
  >("idle");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const normalizedUsername = username.trim().toLowerCase();

    if (!normalizedUsername || !/^[a-z0-9_]+$/.test(normalizedUsername)) {
      return;
    }

    let cancelled = false;

    const timer = window.setTimeout(async () => {
      if (cancelled) {
        return;
      }

      try {
        const response = await fetch(
          `/api/username/check?username=${encodeURIComponent(normalizedUsername)}`,
        );

        if (!response.ok) {
          throw new Error("Username availability check failed.");
        }

        const data = (await response.json()) as {
          available?: boolean;
        };

        if (cancelled) {
          return;
        }

        setUsernameStatus(data.available ? "available" : "taken");
      } catch {
        if (!cancelled) {
          setUsernameStatus("error");
        }
      }
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [username]);

  function getSafeRedirect() {
    const redirectTo = new URLSearchParams(
      window.location.search,
    ).get("redirectTo");

    if (
      redirectTo &&
      redirectTo.startsWith("/") &&
      !redirectTo.startsWith("//")
    ) {
      return redirectTo;
    }

    return "/dashboard";
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setMessage("");

    const normalizedUsername = username.trim().toLowerCase();

    if (!normalizedUsername) {
      setError("Username is required.");
      return;
    }

    if (!/^[a-z0-9_]+$/.test(normalizedUsername)) {
      setError(
        "Username can only contain lowercase letters, numbers, and underscores.",
      );
      return;
    }

    if (usernameStatus !== "available") {
      setError(
        usernameStatus === "checking"
          ? "Please wait until we finish checking your username."
          : "Please choose an available username.",
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const redirectTo = getSafeRedirect();

    const callbackUrl = new URL(
      "/auth/callback",
      window.location.origin,
    );

    callbackUrl.searchParams.set("next", redirectTo);

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          username: normalizedUsername,
        },
        emailRedirectTo: callbackUrl.toString(),
      },
    });

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    setMessage(
      "Account created. Check your email to confirm your account.",
    );
  }

  const loginHref = `/login?redirectTo=${encodeURIComponent(
    getSafeRedirect(),
  )}`;

  return (
    <main className="overflow-hidden">
      <section className="flex min-h-[calc(100vh-65px)] items-center justify-center px-6 py-4">
        <div className="w-full max-w-5xl overflow-hidden rounded-2xl border border-[#deded9] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.05)]">
          <div className="grid md:grid-cols-2">
            {/* Left Side */}
            <div className="flex flex-col justify-between bg-[#f8f8f6] p-7 sm:p-8 md:p-9">
              <div>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-xs font-bold tracking-tight text-[#171717] shadow-sm ring-1 ring-black/[0.04]">
                  BT
                </div>

                <div className="mt-10">
                  <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#777771]">
                    Behind the Code
                  </p>

                  <h1 className="mt-3 max-w-sm text-5xl font-bold leading-[0.9] tracking-[-0.055em] text-[#171717] sm:text-[3.4rem]">
                    Start
                    <br />
                    writing.
                  </h1>

                  <p className="mt-5 max-w-md text-sm leading-6 text-[#777771]">
                    Join developers who share what they build, what they learn,
                    and what happens behind the code.
                  </p>
                </div>
              </div>

              <div className="mt-10">
                <div className="mb-3 h-px w-9 bg-[#aaa9a3]" />

                <p className="max-w-sm text-xs leading-5 text-[#999992]">
                  Turn your projects, lessons, and discoveries into something
                  other developers can learn from.
                </p>
              </div>
            </div>

            {/* Right Side */}
            <div className="p-7 sm:p-8 md:p-9">
              <div className="mx-auto max-w-md">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#777771]">
                    Join the community
                  </p>

                  <h2 className="mt-2 text-3xl font-bold tracking-[-0.04em] text-[#171717]">
                    Create your account.
                  </h2>

                  <p className="mt-2 text-sm leading-5 text-[#777771]">
                    Set up your account and start publishing on Behind the
                    Code.
                  </p>
                </div>

                <div className="my-4 flex items-center gap-3">
                  <div className="h-px flex-1 bg-[#deded9]" />

                  <span className="shrink-0 text-[9px] font-medium uppercase tracking-[0.14em] text-[#aaa9a3]">
                    Or sign up with email
                  </span>

                  <div className="h-px flex-1 bg-[#deded9]" />
                </div>

                {/* Registration Form */}
                <form onSubmit={handleSubmit} className="space-y-3">
                  {/* Name */}
                  <div>
                    <label
                      htmlFor="name"
                      className="mb-1 block text-[10px] font-medium uppercase tracking-[0.12em] text-[#555550]"
                    >
                      Name
                    </label>

                    <input
                      id="name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      placeholder="Your name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      required
                      className="w-full rounded-lg border border-[#deded9] bg-[#fdfdfb] px-4 py-2.5 text-sm text-[#171717] outline-none transition-colors placeholder:text-[#aaa9a3] focus:border-[#999992] focus:bg-white"
                    />
                  </div>

                  {/* Username */}
                  <div>
                    <label
                      htmlFor="username"
                      className="mb-1 block text-[10px] font-medium uppercase tracking-[0.12em] text-[#555550]"
                    >
                      Username
                    </label>

                    <input
                      id="username"
                      name="username"
                      type="text"
                      autoComplete="username"
                      placeholder="your_username"
                      value={username}
                      onChange={(event) => {
                        const value = event.target.value.toLowerCase();

                        setUsername(value);
                        setError("");
                        setMessage("");

                        const normalizedValue = value.trim();

                        if (!normalizedValue) {
                          setUsernameStatus("idle");
                          return;
                        }

                        if (!/^[a-z0-9_]+$/.test(normalizedValue)) {
                          setUsernameStatus("invalid");
                          return;
                        }

                        setUsernameStatus("checking");
                      }}
                      minLength={3}
                      maxLength={30}
                      required
                      className={`w-full rounded-lg border bg-[#fdfdfb] px-4 py-2.5 text-sm text-[#171717] outline-none transition-colors placeholder:text-[#aaa9a3] focus:bg-white ${
                        usernameStatus === "available"
                          ? "border-green-300 focus:border-green-500"
                          : usernameStatus === "taken" ||
                              usernameStatus === "invalid" ||
                              usernameStatus === "error"
                            ? "border-red-300 focus:border-red-500"
                            : "border-[#deded9] focus:border-[#999992]"
                      }`}
                    />

                    <div className="mt-1.5 min-h-4 text-[11px]">
                      {usernameStatus === "checking" && (
                        <p className="text-[#999992]">
                          Checking username...
                        </p>
                      )}

                      {usernameStatus === "available" && (
                        <p className="text-green-600">
                          Username is available.
                        </p>
                      )}

                      {usernameStatus === "taken" && (
                        <p className="text-red-600">
                          Username is already taken.
                        </p>
                      )}

                      {usernameStatus === "invalid" && (
                        <p className="text-red-600">
                          Use only lowercase letters, numbers, and underscores.
                        </p>
                      )}

                      {usernameStatus === "error" && (
                        <p className="text-red-600">
                          Could not check username availability.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label
                      htmlFor="email"
                      className="mb-1 block text-[10px] font-medium uppercase tracking-[0.12em] text-[#555550]"
                    >
                      Email
                    </label>

                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      required
                      className="w-full rounded-lg border border-[#deded9] bg-[#fdfdfb] px-4 py-2.5 text-sm text-[#171717] outline-none transition-colors placeholder:text-[#aaa9a3] focus:border-[#999992] focus:bg-white"
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label
                      htmlFor="password"
                      className="mb-1 block text-[10px] font-medium uppercase tracking-[0.12em] text-[#555550]"
                    >
                      Password
                    </label>

                    <div className="relative">
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="Create a password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                        className="w-full rounded-lg border border-[#deded9] bg-[#fdfdfb] px-4 py-2.5 pr-11 text-sm text-[#171717] outline-none transition-colors placeholder:text-[#aaa9a3] focus:border-[#999992] focus:bg-white"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword((current) => !current)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#999992] transition-colors hover:text-[#171717]"
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label
                      htmlFor="confirm-password"
                      className="mb-1 block text-[10px] font-medium uppercase tracking-[0.12em] text-[#555550]"
                    >
                      Confirm password
                    </label>

                    <div className="relative">
                      <input
                        id="confirm-password"
                        name="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="Repeat your password"
                        value={confirmPassword}
                        onChange={(event) =>
                          setConfirmPassword(event.target.value)
                        }
                        required
                        className="w-full rounded-lg border border-[#deded9] bg-[#fdfdfb] px-4 py-2.5 pr-11 text-sm text-[#171717] outline-none transition-colors placeholder:text-[#aaa9a3] focus:border-[#999992] focus:bg-white"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword((current) => !current)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#999992] transition-colors hover:text-[#171717]"
                        aria-label={
                          showConfirmPassword
                            ? "Hide confirm password"
                            : "Show confirm password"
                        }
                      >
                        {showConfirmPassword ? (
                          <EyeOffIcon />
                        ) : (
                          <EyeIcon />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Error */}
                  {error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs leading-5 text-red-700">
                      {error}
                    </div>
                  )}

                  {/* Success */}
                  {message && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2.5 text-xs leading-5 text-green-700">
                      {message}
                    </div>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-1 flex w-full items-center justify-between rounded-lg bg-[#171717] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#303030] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span>
                      {loading ? "Creating account..." : "Create account"}
                    </span>

                    <span aria-hidden="true">→</span>
                  </button>
                </form>

                {/* Login */}
                <div className="mt-5 border-t border-[#deded9] pt-4">
                  <p className="text-xs text-[#777771]">
                    Already have an account?
                  </p>

                  <Link
                    href={loginHref}
                    className="mt-0.5 inline-block text-sm font-medium text-[#171717] underline decoration-[#c7c7c1] underline-offset-4 transition-colors hover:decoration-[#171717]"
                  >
                    Sign in →
                  </Link>
                </div>

                {/* Home */}
                <div className="mt-4">
                  <Link
                    href="/"
                    className="text-xs text-[#999992] transition-colors hover:text-[#171717]"
                  >
                    ← Back to home
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function EyeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-4.5 w-4.5"
      aria-hidden="true"
    >
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-4.5 w-4.5"
      aria-hidden="true"
    >
      <path d="m3 3 18 18" />
      <path d="M10.6 6.2A10.7 10.7 0 0 1 12 6c6 0 9.5 6 9.5 6a16.6 16.6 0 0 1-3.2 3.8" />
      <path d="M6.2 6.8C3.8 8.3 2.5 12 2.5 12s3.5 6 9.5 6c1 0 1.9-.2 2.7-.5" />
    </svg>
  );
}
