"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { createClient } from "@/components/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      if (!session) {
        setError(
          "This password reset link is invalid or has expired.",
        );
      }

      setCheckingSession(false);
    };

    checkSession();

    return () => {
      mounted = false;
    };
  }, [supabase]);

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setError("");
    setMessage("");

    // Validate before entering loading state.
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setError(
          "This password reset link is invalid or has expired.",
        );
        return;
      }

      const { error: updateError } =
        await supabase.auth.updateUser({
          password,
        });

      if (updateError) {
        setError(updateError.message);
        return;
      }

      setMessage("Password updated successfully.");

      setTimeout(() => {
        router.push("/login");
      }, 1200);
    } catch (err) {
      console.error("Password update error:", err);

      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[calc(100svh-64px)] bg-[#f8f8f5] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100svh-64px)] max-w-5xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-2xl border border-[#deded9] bg-white shadow-[0_20px_60px_rgba(20,20,20,0.06)] lg:grid-cols-2">

          {/* =====================================================
              LEFT SIDE
          ====================================================== */}
          <section className="flex flex-col justify-between bg-[#f8f8f5] p-7 sm:p-9 lg:p-10">
            <div>
              {/* Brand */}
              <Link
                href="/"
                className="inline-flex items-center gap-3"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#171717] text-[10px] font-bold text-white">
                  BT
                </span>

                <span className="text-sm font-semibold text-[#171717]">
                  Behind the Code
                </span>
              </Link>

              {/* Main copy */}
              <div className="mt-16 sm:mt-20">
                <div className="mb-4 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#3568e8]" />

                  <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#777771]">
                    Account recovery
                  </span>
                </div>

                <h1 className="text-4xl font-semibold leading-[0.98] tracking-[-0.045em] text-[#171717] sm:text-5xl">
                  Choose a
                  <br />
                  new one.
                </h1>

                <p className="mt-5 max-w-xs text-sm leading-6 text-[#777771]">
                  Create a new password for your Behind the Code
                  account.
                </p>
              </div>
            </div>

            {/* Bottom note */}
            <div className="mt-12">
              <div className="mb-3 h-px w-7 bg-[#171717]" />

              <p className="max-w-xs text-[11px] leading-5 text-[#777771]">
                Use a password you can remember but others cannot
                easily guess.
              </p>
            </div>
          </section>

          {/* =====================================================
              RIGHT SIDE
          ====================================================== */}
          <section className="flex flex-col justify-center p-7 sm:p-9 lg:p-10">
            <div className="mx-auto w-full max-w-md">

              {/* Heading */}
              <div className="mb-6">
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#777771]">
                  New password
                </p>

                <h2 className="mt-2.5 text-3xl font-semibold tracking-[-0.035em] text-[#171717]">
                  Set a new password.
                </h2>

                <p className="mt-2 text-sm leading-5 text-[#777771]">
                  Choose a new password with at least 8 characters.
                </p>
              </div>

              {/* Checking session */}
              {checkingSession ? (
                <div className="rounded-lg border border-[#deded9] bg-[#f8f8f5] px-4 py-3 text-sm text-[#777771]">
                  Checking your reset link...
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="space-y-4"
                >
                  {/* New password */}
                  <div>
                    <label
                      htmlFor="password"
                      className="mb-1.5 block text-[10px] font-medium uppercase tracking-[0.16em] text-[#777771]"
                    >
                      New password
                    </label>

                    <div className="relative">
                      <input
                        id="password"
                        type={
                          showPassword
                            ? "text"
                            : "password"
                        }
                        value={password}
                        onChange={(event) => {
                          setPassword(event.target.value);
                          setError("");
                          setMessage("");
                        }}
                        placeholder="Enter new password"
                        autoComplete="new-password"
                        disabled={loading}
                        className="h-10.5 w-full rounded-lg border border-[#deded9] bg-white px-3 pr-11 text-sm text-[#171717] outline-none transition placeholder:text-[#aaa] focus:border-[#171717] disabled:cursor-not-allowed disabled:bg-[#f5f5f2]"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword(
                            (current) => !current,
                          )
                        }
                        disabled={loading}
                        aria-label={
                          showPassword
                            ? "Hide password"
                            : "Show password"
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#aaa] transition hover:text-[#171717] disabled:cursor-not-allowed"
                      >
                        {showPassword ? (
                          <svg
                            width="17"
                            height="17"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.7"
                          >
                            <path d="M3 3l18 18" />
                            <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                            <path d="M9.9 4.2A10.7 10.7 0 0 1 12 4c5 0 8.5 4 9.5 6a11.7 11.7 0 0 1-3.2 3.7" />
                            <path d="M6.2 6.2C4.2 7.6 2.9 9.4 2.5 10c1 2 4.5 6 9.5 6 1 0 2-.2 2.9-.5" />
                          </svg>
                        ) : (
                          <svg
                            width="17"
                            height="17"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.7"
                          >
                            <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
                            <circle
                              cx="12"
                              cy="12"
                              r="2.5"
                            />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Confirm password */}
                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="mb-1.5 block text-[10px] font-medium uppercase tracking-[0.16em] text-[#777771]"
                    >
                      Confirm password
                    </label>

                    <div className="relative">
                      <input
                        id="confirmPassword"
                        type={
                          showConfirmPassword
                            ? "text"
                            : "password"
                        }
                        value={confirmPassword}
                        onChange={(event) => {
                          setConfirmPassword(
                            event.target.value,
                          );
                          setError("");
                          setMessage("");
                        }}
                        placeholder="Confirm new password"
                        autoComplete="new-password"
                        disabled={loading}
                        className="h-10.5 w-full rounded-lg border border-[#deded9] bg-white px-3 pr-11 text-sm text-[#171717] outline-none transition placeholder:text-[#aaa] focus:border-[#171717] disabled:cursor-not-allowed disabled:bg-[#f5f5f2]"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(
                            (current) => !current,
                          )
                        }
                        disabled={loading}
                        aria-label={
                          showConfirmPassword
                            ? "Hide password"
                            : "Show password"
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#aaa] transition hover:text-[#171717] disabled:cursor-not-allowed"
                      >
                        {showConfirmPassword ? (
                          <svg
                            width="17"
                            height="17"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.7"
                          >
                            <path d="M3 3l18 18" />
                            <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                            <path d="M9.9 4.2A10.7 10.7 0 0 1 12 4c5 0 8.5 4 9.5 6a11.7 11.7 0 0 1-3.2 3.7" />
                            <path d="M6.2 6.2C4.2 7.6 2.9 9.4 2.5 10c1 2 4.5 6 9.5 6 1 0 2-.2 2.9-.5" />
                          </svg>
                        ) : (
                          <svg
                            width="17"
                            height="17"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.7"
                          >
                            <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
                            <circle
                              cx="12"
                              cy="12"
                              r="2.5"
                            />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Error */}
                  {error && (
                    <div
                      role="alert"
                      className="rounded-lg border border-[#efcaca] bg-[#fff6f6] px-3 py-2.5 text-xs leading-5 text-[#b04444]"
                    >
                      {error}
                    </div>
                  )}

                  {/* Success */}
                  {message && (
                    <div
                      role="status"
                      className="rounded-lg border border-[#cfe3d4] bg-[#f5fbf6] px-3 py-2.5 text-xs leading-5 text-[#397047]"
                    >
                      {message}
                    </div>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex h-10.5 w-full items-center justify-between rounded-lg bg-[#171717] px-4 text-sm font-medium text-white transition hover:bg-[#2a2a2a] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span>
                      {loading
                        ? "Updating password..."
                        : "Update password"}
                    </span>

                    <span aria-hidden="true">
                      →
                    </span>
                  </button>

                  {/* Links */}
                  <div className="border-t border-[#deded9] pt-4">
                    <Link
                      href="/login"
                      className="text-xs font-medium text-[#171717] underline decoration-[#aaa] underline-offset-4 transition hover:decoration-[#171717]"
                    >
                      Back to sign in →
                    </Link>

                    <div className="mt-4">
                      <Link
                        href="/"
                        className="text-xs text-[#777771] transition hover:text-[#171717]"
                      >
                        ← Back to home
                      </Link>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}