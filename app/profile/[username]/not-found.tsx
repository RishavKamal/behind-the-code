import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-[calc(100vh-65px)] bg-[#f4f4f0] text-[#171717]">
      <section className="mx-auto flex min-h-[calc(100vh-65px)] max-w-6xl items-center px-6 py-20 sm:px-8 lg:px-10">
        <div className="w-full">
          <p className="font-mono text-sm text-[#999991]">404 / PROFILE</p>
          <h1 className="mt-5 max-w-3xl text-5xl font-bold leading-[0.92] tracking-[-0.06em] sm:text-6xl md:text-7xl">
            Developer not found.
          </h1>
          <p className="mt-6 max-w-xl text-sm leading-6 text-[#777771] sm:text-base sm:leading-7">
            The username you requested does not match a public Behind the Code profile.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              href="/articles"
              className="rounded-lg bg-[#171717] px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-[#303030]"
            >
              Browse articles
            </Link>
            <Link
              href="/"
              className="rounded-lg border border-[#d6d6d0] bg-white px-5 py-3 text-sm font-medium text-[#555550] transition-colors hover:border-[#bdbdb7] hover:bg-[#fafaf8] hover:text-[#171717]"
            >
              Back to home
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
