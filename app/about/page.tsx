import Link from "next/link";
import { createClient } from "@/components/lib/supabase/server";

const principles = [
  {
    number: "01",
    title: "Build",
    description:
      "Create things that solve real problems. Projects turn ideas into something useful, testable, and real.",
  },
  {
    number: "02",
    title: "Learn",
    description:
      "Understand what happens behind the code — the mistakes, experiments, debugging, and decisions that shape the final result.",
  },
  {
    number: "03",
    title: "Share",
    description:
      "Document what you discover so difficult concepts, problems, and solutions become easier for someone else to understand.",
  },
  {
    number: "04",
    title: "Improve",
    description:
      "Keep refining the work. Good software is rarely created perfectly on the first attempt.",
  },
];

const journalSections = [
  {
    number: "01",
    title: "Technical Articles",
    description:
      "Programming concepts, frameworks, tools, and practical technical explanations.",
  },
  {
    number: "02",
    title: "Project Notes",
    description:
      "The decisions, problems, experiments, and solutions behind projects.",
  },
  {
    number: "03",
    title: "Learning",
    description:
      "Notes from studying new technologies, solving problems, and understanding concepts from first principles.",
  },
  {
    number: "04",
    title: "Developer Perspectives",
    description:
      "Thoughts about building software and becoming a better developer through the process.",
  },
];

export default async function AboutPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const writeArticleHref = user
    ? "/dashboard/articles/new"
    : "/login?redirectTo=/dashboard/articles/new";

  return (
    <main className="min-h-screen overflow-hidden bg-[#f8f8f5] text-[#171717]">
      {/* =========================================================
          HERO
      ========================================================= */}
      <section className="relative border-b border-[#deded9]">
        {/* Editorial grid */}
        <div
          className="pointer-events-none absolute inset-0 animate-about-grid opacity-60 motion-reduce:animate-none"
          style={{
            backgroundImage:
              "linear-gradient(#e7e7e2 1px, transparent 1px), linear-gradient(90deg, #e7e7e2 1px, transparent 1px)",
            backgroundSize: "44px 44px",
            maskImage:
              "linear-gradient(to bottom, black 0%, black 72%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, black 0%, black 72%, transparent 100%)",
          }}
        />

        {/* Soft atmosphere */}
        <div className="pointer-events-none absolute right-[8%] top-[-120px] h-[480px] w-[480px] animate-about-glow rounded-full bg-[#dfe8ff]/45 blur-[120px] motion-reduce:animate-none" />

        <div className="relative mx-auto max-w-6xl px-6 pb-24 pt-20 sm:px-8 lg:px-10 lg:pb-28 lg:pt-24">
          {/* Identity */}
          <div className="flex animate-about-fade-up items-start justify-between motion-reduce:animate-none">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#171717] text-[10px] font-semibold text-white transition-transform duration-300 hover:-rotate-3">
                BT
              </div>

              <div>
                <p className="text-xs font-semibold">
                  Behind the Code
                </p>

                <p className="mt-0.5 text-[8px] uppercase tracking-[0.2em] text-[#999992]">
                  Developer Journal
                </p>
              </div>
            </div>

            <div className="hidden rounded-full border border-[#deded9] bg-white/80 px-4 py-2 sm:block">
              <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#777771]">
                About the journal
              </span>
            </div>
          </div>

          {/* Hero */}
          <div className="mt-20 grid gap-16 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-end">
            <div>
              <p
                className="animate-about-fade-up text-[10px] font-semibold uppercase tracking-[0.22em] text-[#3568e8] motion-reduce:animate-none"
                style={{ animationDelay: "80ms" }}
              >
                Build · Learn · Share
              </p>

              <h1
                className="mt-6 max-w-4xl animate-about-fade-up text-[clamp(4rem,8vw,7.5rem)] font-semibold leading-[0.84] tracking-[-0.07em] motion-reduce:animate-none"
                style={{ animationDelay: "140ms" }}
              >
                Behind
                <br />
                the Code.
              </h1>

              <p
                className="mt-9 max-w-xl animate-about-fade-up text-base leading-7 text-[#777771] motion-reduce:animate-none sm:text-lg"
                style={{ animationDelay: "220ms" }}
              >
                A developer journal about the ideas, lessons, projects,
                experiments, and decisions that happen behind the finished
                product.
              </p>

              <div
                className="mt-8 flex animate-about-fade-up flex-wrap gap-3 motion-reduce:animate-none"
                style={{ animationDelay: "300ms" }}
              >
                <Link
                  href="/articles"
                  className="inline-flex items-center gap-3 rounded-xl bg-[#171717] px-5 py-3 text-sm font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:bg-[#292929] hover:shadow-[0_10px_25px_rgba(20,20,20,0.12)]"
                >
                  Explore articles
                  <span
                    aria-hidden="true"
                    className="transition-transform duration-300 group-hover:translate-x-1"
                  >
                    →
                  </span>
                </Link>

                <Link
                  href="/topics"
                  className="inline-flex items-center rounded-xl border border-[#deded9] bg-white px-5 py-3 text-sm font-semibold text-[#171717] transition duration-300 hover:-translate-y-0.5 hover:border-[#bdbdb6] hover:shadow-[0_10px_25px_rgba(20,20,20,0.06)]"
                >
                  Browse topics
                </Link>
              </div>
            </div>

            {/* Unique About-page visual */}
            <div
              className="relative animate-about-scale-in motion-reduce:animate-none"
              style={{ animationDelay: "220ms" }}
            >
              {/* Background index card */}
              <div className="absolute -right-3 -top-6 h-full w-full rounded-3xl border border-[#deded9] bg-white/50 transition-transform duration-500 group-hover:translate-x-1 sm:-right-5 sm:-top-8" />

              {/* Main journal card */}
              <div className="relative rounded-3xl border border-[#deded9] bg-white p-7 shadow-[0_25px_60px_rgba(20,20,20,0.07)] transition duration-500 hover:-translate-y-1 hover:shadow-[0_30px_70px_rgba(20,20,20,0.1)] sm:p-8">
                <div className="flex items-center justify-between border-b border-[#deded9] pb-5">
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#999992]">
                      Journal Index
                    </p>

                    <p className="mt-1 text-sm font-semibold">
                      What happens behind the code?
                    </p>
                  </div>

                  <span className="font-mono text-[10px] text-[#999992]">
                    2026
                  </span>
                </div>

                <div className="divide-y divide-[#deded9]">
                  {principles.slice(0, 3).map((principle, index) => (
                    <div
                      key={principle.number}
                      className="group flex animate-about-fade-up items-center gap-5 py-6 motion-reduce:animate-none"
                      style={{
                        animationDelay: `${380 + index * 80}ms`,
                      }}
                    >
                      <span className="font-mono text-[10px] text-[#999992]">
                        {principle.number}
                      </span>

                      <div className="flex-1">
                        <p className="text-lg font-semibold tracking-[-0.02em]">
                          {principle.title}
                        </p>

                        <p className="mt-1 text-xs leading-5 text-[#777771]">
                          {principle.description.split(".")[0]}.
                        </p>
                      </div>

                      <span className="text-lg text-[#c5c5bf] transition duration-300 group-hover:translate-x-1 group-hover:text-[#3568e8]">
                        →
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-2 border-t border-[#deded9] pt-5">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#999992]">
                      The process matters
                    </span>

                    <span className="h-2 w-2 animate-about-pulse rounded-full bg-[#3568e8] motion-reduce:animate-none" />
                  </div>
                </div>
              </div>

              {/* Small floating note */}
              <div className="absolute -bottom-7 -left-4 rounded-xl border border-[#deded9] bg-[#171717] px-5 py-4 text-white shadow-[0_15px_35px_rgba(20,20,20,0.12)] transition duration-300 hover:-translate-y-1 sm:-left-8">
                <p className="text-[8px] font-semibold uppercase tracking-[0.18em] text-white/45">
                  Current focus
                </p>

                <p className="mt-1.5 text-xs font-medium">
                  Document the process.
                </p>
              </div>
            </div>
          </div>

          {/* About page closing line */}
          <div
            className="mt-24 animate-about-fade-up border-y border-[#deded9] py-5 motion-reduce:animate-none"
            style={{ animationDelay: "650ms" }}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#777771]">
                Behind the Code
              </p>

              <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#999991]">
                The ideas behind the work
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          THE IDEA
      ========================================================= */}
      <section className="border-b border-[#deded9]">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:px-8 lg:px-10 lg:py-28">
          <div className="grid gap-12 lg:grid-cols-[220px_minmax(0,1fr)]">
            <div className="animate-about-fade-up motion-reduce:animate-none">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#777771]">
                01 / The Idea
              </p>
            </div>

            <div className="animate-about-fade-up motion-reduce:animate-none">
              <h2 className="max-w-4xl text-3xl font-semibold leading-[1.1] tracking-[-0.04em] sm:text-4xl lg:text-5xl">
                Software is more than the final result.
                <br className="hidden sm:block" /> There are decisions,
                experiments, mistakes, and lessons behind every piece of code.
              </h2>

              <div className="mt-12 grid gap-8 md:grid-cols-2">
                <p className="text-[15px] leading-7 text-[#777771]">
                  Behind the Code is a place to document those parts. It is
                  designed for developers who want to share how they approached
                  a problem, what they discovered while building something,
                  and what they learned along the way.
                </p>

                <p className="text-[15px] leading-7 text-[#777771]">
                  The goal is not simply to show finished projects. It is to
                  make the process behind them easier to understand.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          WHY IT EXISTS
      ========================================================= */}
      <section className="border-b border-[#deded9]">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:px-8 lg:px-10 lg:py-28">
          <div className="grid gap-12 lg:grid-cols-[220px_minmax(0,1fr)]">
            <div className="animate-about-fade-up motion-reduce:animate-none">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#777771]">
                02 / Why It Exists
              </p>
            </div>

            <div className="animate-about-scale-in relative overflow-hidden rounded-3xl border border-[#deded9] bg-white p-8 transition duration-500 hover:shadow-[0_25px_60px_rgba(20,20,20,0.07)] motion-reduce:animate-none sm:p-12 lg:p-14">
              <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 rounded-full bg-[#dfe8ff]/35 blur-3xl" />

              <div className="relative">
                <div className="mb-8 flex items-center justify-between">
                  <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#999992]">
                    A simple idea
                  </span>

                  <span className="font-mono text-[10px] text-[#999992]">
                    02
                  </span>
                </div>

                <h2 className="max-w-3xl text-4xl font-semibold leading-[1.02] tracking-[-0.05em] sm:text-5xl lg:text-6xl">
                  Learn from the process,
                  <br />
                  not only the result.
                </h2>

                <div className="mt-10 grid gap-8 md:grid-cols-2">
                  <p className="text-[15px] leading-7 text-[#777771]">
                    Tutorials are useful for learning individual concepts, but
                    real development introduces problems that are difficult to
                    encounter while following a fixed example.
                  </p>

                  <p className="text-[15px] leading-7 text-[#777771]">
                    A project can fail because of a small configuration
                    mistake. An implementation can change after discovering a
                    better approach. Those moments are worth documenting.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          PRINCIPLES
      ========================================================= */}
      <section className="border-b border-[#deded9]">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:px-8 lg:px-10 lg:py-28">
          <div className="grid gap-12 lg:grid-cols-[220px_minmax(0,1fr)]">
            <div className="animate-about-fade-up motion-reduce:animate-none">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#777771]">
                03 / Principles
              </p>
            </div>

            <div>
              <div className="divide-y divide-[#deded9] border-y border-[#deded9]">
                {principles.map((principle, index) => (
                  <article
                    key={principle.number}
                    className="grid animate-about-fade-up gap-6 py-8 motion-reduce:animate-none md:grid-cols-[70px_180px_minmax(0,1fr)] md:items-start"
                    style={{
                      animationDelay: `${index * 90}ms`,
                    }}
                  >
                    <span className="font-mono text-[11px] text-[#999992]">
                      {principle.number}
                    </span>

                    <h3 className="text-2xl font-semibold tracking-[-0.03em] transition-transform duration-300 hover:translate-x-1">
                      {principle.title}
                    </h3>

                    <p className="max-w-xl text-[15px] leading-7 text-[#777771]">
                      {principle.description}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          WHAT WE SHARE
      ========================================================= */}
      <section className="border-b border-[#deded9]">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:px-8 lg:px-10 lg:py-28">
          <div className="grid gap-12 lg:grid-cols-[220px_minmax(0,1fr)]">
            <div className="animate-about-fade-up motion-reduce:animate-none">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#777771]">
                04 / What We Share
              </p>
            </div>

            <div>
              <h2 className="animate-about-fade-up max-w-3xl text-4xl font-semibold leading-[1.04] tracking-[-0.045em] motion-reduce:animate-none sm:text-5xl">
                Things worth documenting.
              </h2>

              <p
                className="mt-6 max-w-2xl animate-about-fade-up text-[15px] leading-7 text-[#777771] motion-reduce:animate-none"
                style={{ animationDelay: "80ms" }}
              >
                Different parts of the development journey, from technical
                implementation to the lessons that come from building.
              </p>

              <div className="mt-12 grid gap-3 sm:grid-cols-2">
                {journalSections.map((section, index) => (
                  <article
                    key={section.number}
                    className="group animate-about-scale-in rounded-2xl border border-[#deded9] bg-white p-7 transition duration-300 hover:-translate-y-1 hover:shadow-[0_15px_35px_rgba(20,20,20,0.05)] motion-reduce:animate-none"
                    style={{
                      animationDelay: `${140 + index * 90}ms`,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-[#999992]">
                        {section.number}
                      </span>

                      <span className="text-[#c4c4be] transition duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-[#3568e8]">
                        ↗
                      </span>
                    </div>

                    <h3 className="mt-8 text-xl font-semibold tracking-[-0.025em]">
                      {section.title}
                    </h3>

                    <p className="mt-3 text-[14px] leading-6 text-[#777771]">
                      {section.description}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          QUOTE
      ========================================================= */}
      <section className="border-b border-[#deded9]">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:px-8 lg:px-10 lg:py-32">
          <div className="animate-about-scale-in relative overflow-hidden rounded-3xl border border-[#deded9] bg-white px-7 py-16 transition duration-500 hover:shadow-[0_25px_60px_rgba(20,20,20,0.07)] motion-reduce:animate-none sm:px-12 lg:px-20 lg:py-20">
            <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#dfe8ff]/35 blur-3xl" />

            <div className="relative max-w-4xl">
              <div className="mb-8 flex items-center gap-3">
                <span className="h-px w-8 bg-[#3568e8]" />

                <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#999992]">
                  Behind the Code
                </span>
              </div>

              <blockquote className="text-3xl font-semibold leading-[1.08] tracking-[-0.045em] sm:text-4xl lg:text-5xl">
                “The finished product shows what was built. The process
                explains why it was built that way.”
              </blockquote>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          FINAL CTA
      ========================================================= */}
      <section>
        <div className="mx-auto max-w-6xl px-6 py-24 sm:px-8 lg:px-10 lg:py-28">
          <div className="animate-about-scale-in relative overflow-hidden rounded-3xl border border-[#deded9] bg-white p-8 transition duration-500 hover:shadow-[0_25px_60px_rgba(20,20,20,0.07)] motion-reduce:animate-none sm:p-12 lg:p-16">
            <div className="pointer-events-none absolute right-0 top-0 h-72 w-72 animate-about-glow rounded-full bg-[#dfe8ff]/35 blur-3xl motion-reduce:animate-none" />

            <div className="relative flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl">
                <p className="animate-about-fade-up text-[10px] font-semibold uppercase tracking-[0.2em] text-[#3568e8] motion-reduce:animate-none">
                  Keep Building
                </p>

                <h2
                  className="mt-5 animate-about-fade-up text-4xl font-semibold leading-[1.02] tracking-[-0.05em] motion-reduce:animate-none sm:text-5xl lg:text-6xl"
                  style={{ animationDelay: "80ms" }}
                >
                  There is always something behind the code.
                </h2>

                <p
                  className="mt-6 max-w-xl animate-about-fade-up text-[15px] leading-7 text-[#777771] motion-reduce:animate-none"
                  style={{ animationDelay: "160ms" }}
                >
                  Explore the articles, follow the ideas, or document something
                  you have learned along the way.
                </p>
              </div>

              <div
                className="flex shrink-0 animate-about-fade-up flex-wrap gap-3 motion-reduce:animate-none"
                style={{ animationDelay: "240ms" }}
              >
                <Link
                  href="/articles"
                  className="inline-flex items-center gap-3 rounded-xl bg-[#171717] px-6 py-3.5 text-sm font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:bg-[#292929] hover:shadow-[0_12px_25px_rgba(20,20,20,0.12)]"
                >
                  Explore articles
                  <span className="transition-transform duration-300 group-hover:translate-x-1">
                    →
                  </span>
                </Link>

                <Link
                  href={writeArticleHref}
                  className="inline-flex items-center rounded-xl border border-[#deded9] bg-white px-6 py-3.5 text-sm font-semibold text-[#171717] transition duration-300 hover:-translate-y-0.5 hover:border-[#bdbdb6] hover:shadow-[0_10px_25px_rgba(20,20,20,0.06)]"
                >
                  Write an article
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          ABOUT PAGE ANIMATION STYLES
      ========================================================= */}
      <style>{`
        @keyframes about-fade-up {
          from {
            opacity: 0;
            transform: translateY(28px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes about-scale-in {
          from {
            opacity: 0;
            transform: translateY(22px) scale(0.985);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes about-grid {
          from {
            transform: translateY(-10px);
          }

          to {
            transform: translateY(10px);
          }
        }

        @keyframes about-glow {
          0%,
          100% {
            transform: translate3d(0, 0, 0) scale(1);
          }

          50% {
            transform: translate3d(-18px, 12px, 0) scale(1.04);
          }
        }

        @keyframes about-pulse {
          0%,
          100% {
            opacity: 0.45;
            transform: scale(0.85);
          }

          50% {
            opacity: 1;
            transform: scale(1.15);
          }
        }

        .animate-about-fade-up {
          opacity: 0;
          animation: about-fade-up 700ms
            cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }

        .animate-about-scale-in {
          opacity: 0;
          animation: about-scale-in 750ms
            cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }

        .animate-about-grid {
          animation: about-grid 8s ease-in-out infinite alternate;
        }

        .animate-about-glow {
          animation: about-glow 9s ease-in-out infinite;
        }

        .animate-about-pulse {
          animation: about-pulse 2.4s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-about-fade-up,
          .animate-about-scale-in {
            opacity: 1;
            animation: none;
          }

          .animate-about-grid,
          .animate-about-glow,
          .animate-about-pulse {
            animation: none;
          }
        }
      `}</style>
    </main>
  );
}