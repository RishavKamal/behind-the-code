"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

import { createClient } from "@/components/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setMessage("");
    setLoading(true);

    try {
      const supabase = createClient();

      const redirectTo = `${window.location.origin}/reset-password`;

      const { error: resetError } =
        await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo,
        });

      if (resetError) {
        setError(resetError.message);
        return;
      }

      setMessage(
        "If an account exists with this email, a password reset link has been sent.",
      );
    } catch (error) {
      console.error("Password reset error:", error);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[calc(100svh-65px)] bg-[#f8f8f5]">
      <section className="mx-auto flex min-h-[calc(100svh-65px)] max-w-6xl items-center px-6 py-5">
        <div className="w-full overflow-hidden rounded-2xl border border-[#deded9] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.05)]">
          <div className="grid md:grid-cols-[0.9fr_1.1fr]">
            {/* Left side */}
            <div className="relative flex min-h-[500px] flex-col justify-between border-b border-[#deded9] bg-[#f8f8f5] p-7 sm:p-8 md:border-b-0 md:border-r md:p-10">
              <div>
                <Link
                  href="/"
                  className="inline-flex items-center gap-3"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#171717] text-[10px] font-bold tracking-tight text-white">
                    BT
                  </span>

                  <span className="text-sm font-semibold tracking-[-0.02em] text-[#171717]">
                    Behind the Code
                  </span>
                </Link>

                <div className="mt-16 max-w-md md:mt-20">
                  <div className="mb-4 flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#3568e8]" />

                    <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#777771]">
                      Account recovery
                    </span>
                  </div>

                  <h1 className="text-5xl font-bold leading-[0.95] tracking-[-0.055em] text-[#171717] sm:text-6xl">
                    Get back
                    <br />
                    in.
                  </h1>

                  <p className="mt-6 max-w-sm text-sm leading-7 text-[#777771] md:text-base">
                    Forgot your password? No problem. Enter your
                    account email and we&apos;ll help you get back
                    to your work.
                  </p>
                </div>
              </div>

              <div className="mt-12">
                <div className="mb-3 h-px w-8 bg-[#171717]" />

                <p className="max-w-xs text-xs leading-5 text-[#999992]">
                  Your account, your work, your writing. Get back
                  to it securely.
                </p>
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center p-7 sm:p-8 md:p-10">
              <div className="mx-auto w-full max-w-md">
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#777771]">
                    Reset access
                  </p>

                  <h2 className="mt-2 text-3xl font-bold tracking-[-0.045em] text-[#171717] sm:text-4xl">
                    Reset your password.
                  </h2>

                  <p className="mt-3 max-w-md text-sm leading-6 text-[#777771]">
                    Enter the email address associated with your
                    account and we&apos;ll send you a secure reset
                    link.
                  </p>
                </div>

                <form
                  onSubmit={handleSubmit}
                  className="mt-7 space-y-4"
                >
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
                      onChange={(event) => {
                        setEmail(event.target.value);
                        setError("");
                        setMessage("");
                      }}
                      required
                      className="h-10 w-full rounded-lg border border-[#deded9] bg-[#fdfdfb] px-4 text-sm text-[#171717] outline-none transition-colors placeholder:text-[#aaa9a3] focus:border-[#999992] focus:bg-white"
                    />
                  </div>

                  {error && (
                    <div
                      role="alert"
                      className="rounded-lg border border-[#e7caca] bg-[#fdf5f5] px-3.5 py-3 text-xs leading-5 text-[#9a4d4d]"
                    >
                      {error}
                    </div>
                  )}

                  {message && (
                    <div
                      role="status"
                      className="rounded-lg border border-[#d7e1d8] bg-[#f7faf7] px-3.5 py-3 text-xs leading-5 text-[#66796a]"
                    >
                      {message}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex h-10 w-full items-center justify-between rounded-lg bg-[#171717] px-4 text-sm font-medium text-white transition-colors hover:bg-[#303030] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span>
                      {loading
                        ? "Sending..."
                        : "Send reset link"}
                    </span>

                    <span
                      aria-hidden="true"
                      className="text-base"
                    >
                      →
                    </span>
                  </button>
                </form>

                <div className="mt-6 border-t border-[#deded9] pt-5">
                  <p className="text-xs text-[#777771]">
                    Remember your password?
                  </p>

                  <Link
                    href="/login"
                    className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-[#171717] underline decoration-[#c7c7c1] underline-offset-4 transition-colors hover:decoration-[#171717]"
                  >
                    Back to sign in
                    <span aria-hidden="true">→</span>
                  </Link>
                </div>

                <Link
                  href="/"
                  className="mt-5 inline-block text-xs text-[#999992] transition-colors hover:text-[#171717]"
                >
                  ← Back to home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}