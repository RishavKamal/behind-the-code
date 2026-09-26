"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { createClient } from "@/components/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get("error") === "auth_callback_failed") {
      setError("Authentication failed. Please try again.");
    }
  }, []);

  function getSafeNextPath() {
    const requestedPath = new URLSearchParams(window.location.search).get(
      "redirectTo",
    );

    if (
      requestedPath &&
      requestedPath.startsWith("/") &&
      !requestedPath.startsWith("//")
    ) {
      return requestedPath;
    }

    return "/dashboard";
  }


  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    const supabase = createClient();

    const { error: signInError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    router.push(getSafeNextPath());
    router.refresh();
  }

  return (
    <main className="overflow-hidden">
      <section className="flex min-h-[calc(100vh-65px)] items-center justify-center px-6 py-6">
        <div className="w-full max-w-5xl overflow-hidden rounded-2xl border border-[#deded9] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.05)]">
          <div className="grid md:grid-cols-2">
            {/* Left Side */}
            <div className="flex min-h-[500px] flex-col justify-between border-b border-[#deded9] bg-[#f8f8f6] p-7 sm:p-8 md:border-b-0 md:border-r md:p-10">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-xs font-bold tracking-tight text-[#171717] shadow-sm ring-1 ring-black/[0.04]">
                  BT
                </div>

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

              <div className="mt-10">
                <div className="mb-4 h-px w-10 bg-[#aaa9a3]" />

                <p className="max-w-sm text-xs leading-5 text-[#999992]">
                  A place for developers to document what they build, learn,
                  and discover.
                </p>
              </div>
            </div>

            {/* Right Side */}
            <div className="p-7 sm:p-8 md:p-10">
              <div className="mx-auto max-w-md">
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

                <div className="my-5 flex items-center gap-3">
                  <div className="h-px flex-1 bg-[#deded9]" />

                  <span className="shrink-0 text-[9px] font-medium uppercase tracking-[0.14em] text-[#aaa9a3]">
                    Or continue with email
                  </span>

                  <div className="h-px flex-1 bg-[#deded9]" />
                </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Email */}
                  <div>
                    <label
                      htmlFor="email"
                      className="mb-1.5 block text-[10px] font-medium uppercase tracking-[0.12em] text-[#555550]"
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
                    <div className="mb-1.5 flex items-center justify-between">
                      <label
                        htmlFor="password"
                        className="block text-[10px] font-medium uppercase tracking-[0.12em] text-[#555550]"
                      >
                        Password
                      </label>

                      <Link
                        href="/forgot-password"
                        className="text-xs text-[#777771] transition-colors hover:text-[#171717]"
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

                  {/* Error */}
                  {error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs leading-5 text-red-700">
                      {error}
                    </div>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-between rounded-lg bg-[#171717] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#303030] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span>{loading ? "Signing in..." : "Sign in"}</span>
                    <span aria-hidden="true">→</span>
                  </button>
                </form>

                {/* Register */}
                <div className="mt-6 border-t border-[#deded9] pt-5">
                  <p className="text-xs text-[#777771]">
                    Don&apos;t have an account?
                  </p>

                  <Link
                    href="/register"
                    className="mt-1 inline-block text-sm font-medium text-[#171717] underline decoration-[#c7c7c1] underline-offset-4 transition-colors hover:decoration-[#171717]"
                  >
                    Create an account →
                  </Link>
                </div>

                {/* Home */}
                <div className="mt-5">
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
