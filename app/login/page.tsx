"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

import ScrollReveal from "@/components/scroll-reveal";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [redirectTo, setRedirectTo] = useState("/");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get("error") === "auth_callback_failed") {
      setError("Authentication failed. Please try again.");
    }

    const redirect = params.get("redirectTo");

    if (
      redirect &&
      redirect.startsWith("/") &&
      !redirect.startsWith("//")
    ) {
      setRedirectTo(redirect);
    }
  }, []);

  /**
   * Returns the page the user originally wanted to visit.
   *
   * Example:
   * /login?redirectTo=/articles/my-article
   *
   * becomes:
   * /articles/my-article
   *
   * If there is no valid redirectTo value, we go to the home page.
   */
  function getSafeRedirect() {
    const params = new URLSearchParams(window.location.search);

    const redirectTo = params.get("redirectTo");

    if (
      redirectTo &&
      redirectTo.startsWith("/") &&
      !redirectTo.startsWith("//")
    ) {
      return redirectTo;
    }

    return "/";
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/username-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          identifier: identifier.trim(),
          password,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(data?.error || "Something went wrong. Please try again.");
        return;
      }

      /*
       * Full browser navigation.
       *
       * This intentionally uses window.location.href instead of
       * router.push() so the newly created Supabase session is
       * available everywhere immediately after login.
       */
      const destination = getSafeRedirect();

      window.location.href = destination;
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="overflow-hidden">
      <section className="flex min-h-[calc(100vh-65px)] items-center justify-center px-6 py-6">
        <div className="w-full max-w-5xl overflow-hidden rounded-2xl border border-[#deded9] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.05)]">
          <div className="grid md:grid-cols-2">
            {/* =========================================================
                LEFT SIDE
            ========================================================= */}
            <ScrollReveal distance={24} duration={700}>
              <div className="flex min-h-[500px] flex-col justify-between border-b border-[#deded9] bg-[#f8f8f6] p-7 sm:p-8 md:border-b-0 md:border-r md:p-10">
                <div>
                  {/* Logo */}
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-xs font-bold tracking-tight text-[#171717] shadow-sm ring-1 ring-black/[0.04]">
                    BT
                  </div>

                  {/* Hero */}
                  <div className="mt-12">
                    <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#777771]">
                      Behind the Code
                    </p>

                    <h1 className="mt-4 max-w-sm text-5xl font-bold leading-[0.94] tracking-[-0.055em] text-[#171717] sm:text-6xl">
                      Welcome
                      <br />
                      back.
                    </h1>

                    <p className="mt-6 max-w-md text-sm leading-6 text-[#777771] md:text-base md:leading-7">
                      Sign in to continue reading, writing, and sharing what
                      happens behind the code.
                    </p>
                  </div>
                </div>

                {/* Bottom description */}
                <div className="mt-10">
                  <div className="mb-4 h-px w-10 bg-[#aaa9a3]" />

                  <p className="max-w-sm text-xs leading-5 text-[#999992]">
                    A place for developers to document what they build, learn,
                    and discover.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            {/* =========================================================
                RIGHT SIDE
            ========================================================= */}
            <ScrollReveal distance={20} delay={100} duration={700}>
              <div className="p-7 sm:p-8 md:p-10">
                <div className="mx-auto max-w-md">
                  {/* Header */}
                  <ScrollReveal distance={14} duration={600}>
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#777771]">
                        Account access
                      </p>

                      <h2 className="mt-2 text-3xl font-bold tracking-[-0.04em] text-[#171717]">
                        Sign in.
                      </h2>

                      <p className="mt-2 text-sm leading-5 text-[#777771]">
                        Enter your credentials to continue to Behind the Code.
                      </p>
                    </div>
                  </ScrollReveal>

                  {/* Divider */}
                  <div className="my-5 flex items-center gap-3">
                    <div className="h-px flex-1 bg-[#deded9]" />

                    <span className="shrink-0 text-[9px] font-medium uppercase tracking-[0.14em] text-[#aaa9a3]">
                      Use your username or email
                    </span>

                    <div className="h-px flex-1 bg-[#deded9]" />
                  </div>

                  {/* =====================================================
                      LOGIN FORM
                  ===================================================== */}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Username / Email */}
                    <div>
                      <label
                        htmlFor="identifier"
                        className="mb-1.5 block text-[10px] font-medium uppercase tracking-[0.12em] text-[#555550]"
                      >
                        Username or email
                      </label>

                      <input
                        id="identifier"
                        name="identifier"
                        type="text"
                        autoComplete="username"
                        placeholder="username or you@example.com"
                        value={identifier}
                        onChange={(event) =>
                          setIdentifier(event.target.value)
                        }
                        required
                        className="w-full rounded-lg border border-[#deded9] bg-[#fdfdfb] px-4 py-2.5 text-sm text-[#171717] outline-none transition-[border-color,background-color,box-shadow] duration-200 placeholder:text-[#aaa9a3] focus:border-[#999992] focus:bg-white focus:ring-2 focus:ring-black/[0.03]"
                      />
                    </div>

                    {/* Password */}
                    <div>
                      <div className="mb-1.5 flex items-center justify-between">
                        <label
                          htmlFor="password"
                          className="block text-[10px] font-medium uppercase tracking-[0.12em] text-[#555550]"
                        >
                          Password
                        </label>

                        <Link
                          href="/forgot-password"
                          className="text-xs text-[#777771] transition-colors duration-200 hover:text-[#171717]"
                        >
                          Forgot password?
                        </Link>
                      </div>

                      <div className="relative">
                        <input
                          id="password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          autoComplete="current-password"
                          placeholder="Enter your password"
                          value={password}
                          onChange={(event) =>
                            setPassword(event.target.value)
                          }
                          required
                          className="w-full rounded-lg border border-[#deded9] bg-[#fdfdfb] px-4 py-2.5 pr-11 text-sm text-[#171717] outline-none transition-[border-color,background-color,box-shadow] duration-200 placeholder:text-[#aaa9a3] focus:border-[#999992] focus:bg-white focus:ring-2 focus:ring-black/[0.03]"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowPassword((current) => !current)
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#999992] transition-colors duration-200 hover:text-[#171717]"
                          aria-label={
                            showPassword ? "Hide password" : "Show password"
                          }
                        >
                          {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                        </button>
                      </div>
                    </div>

                    {/* Error */}
                    {error && (
                      <ScrollReveal distance={10} duration={400}>
                        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs leading-5 text-red-700">
                          {error}
                        </div>
                      </ScrollReveal>
                    )}

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex w-full items-center justify-between rounded-lg bg-[#171717] px-4 py-2.5 text-sm font-medium text-white transition-[background-color,transform,opacity] duration-200 hover:bg-[#303030] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <span>
                        {loading ? "Signing in..." : "Sign in"}
                      </span>

                      <span
                        aria-hidden="true"
                        className="transition-transform duration-200"
                      >
                        →
                      </span>
                    </button>
                  </form>

                  {/* =====================================================
                      REGISTER / HOME
                  ===================================================== */}
                  <ScrollReveal distance={14} delay={150} duration={600}>
                    <div className="mt-6 border-t border-[#deded9] pt-5">
                      <p className="text-xs text-[#777771]">
                        Don&apos;t have an account?
                      </p>

                      <Link
                        href={
                          redirectTo === "/"
                            ? "/register"
                            : `/register?redirectTo=${encodeURIComponent(redirectTo)}`
                        }
                        className="mt-1 inline-block text-sm font-medium text-[#171717] underline decoration-[#c7c7c1] underline-offset-4 transition-colors duration-200 hover:decoration-[#171717]"
                      >
                        Create an account →
                      </Link>
                    </div>

                    <div className="mt-5">
                      <Link
                        href="/"
                        className="text-xs text-[#999992] transition-colors duration-200 hover:text-[#171717]"
                      >
                        ← Back to home
                      </Link>
                    </div>
                  </ScrollReveal>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>
    </main>
  );
}

/* =========================================================
   ICONS
========================================================= */

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