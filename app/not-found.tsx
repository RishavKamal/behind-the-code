import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-[calc(100vh-65px)] bg-[#f4f4f0] text-[#171717]">
      <section className="mx-auto flex min-h-[calc(100vh-65px)] max-w-6xl items-center px-6 py-20 sm:px-8 lg:px-10">
        <div className="w-full">
          <div className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#999991]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#3568e8]" />
            Behind the Code
          </div>

          <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_320px] lg:items-end">
            <div>
              <p className="font-mono text-sm text-[#999991]">404</p>

              <h1 className="mt-4 max-w-3xl text-6xl font-bold leading-[0.9] tracking-[-0.06em] sm:text-7xl lg:text-8xl">
                This page
                <br />
                doesn&apos;t exist.
              </h1>

              <p className="mt-7 max-w-xl text-sm leading-6 text-[#777771] sm:text-base sm:leading-7">
                The page you are looking for may have moved, been removed, or
                never existed in the first place.
              </p>

              <div className="mt-9 flex flex-wrap gap-3">
                <Link
                  href="/"
                  className="rounded-lg bg-[#171717] px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-[#303030]"
                >
                  Back to home
                </Link>

                <Link
                  href="/articles"
                  className="rounded-lg border border-[#d6d6d0] bg-white px-5 py-3 text-sm font-medium text-[#555550] transition-colors hover:border-[#bdbdb7] hover:bg-[#fafaf8] hover:text-[#171717]"
                >
                  Browse articles
                </Link>
              </div>
            </div>

            <div className="border-t border-[#deded9] pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#999991]">
                Keep exploring
              </p>

              <div className="mt-5 space-y-3 text-sm">
                <Link
                  href="/topics"
                  className="flex items-center justify-between border-b border-[#deded9] pb-3 text-[#555550] transition-colors hover:text-[#171717]"
                >
                  <span>Topics</span>
                  <span aria-hidden="true">→</span>
                </Link>

                <Link
                  href="/about"
                  className="flex items-center justify-between border-b border-[#deded9] pb-3 text-[#555550] transition-colors hover:text-[#171717]"
                >
                  <span>About</span>
                  <span aria-hidden="true">→</span>
                </Link>

                <Link
                  href="/register"
                  className="flex items-center justify-between border-b border-[#deded9] pb-3 text-[#555550] transition-colors hover:text-[#171717]"
                >
                  <span>Start writing</span>
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-16 border-t border-[#deded9] pt-5">
            <p className="text-xs text-[#aaa9a3]">
              Error 404 · The requested resource could not be found.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
