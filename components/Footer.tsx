export default function Footer() {
  return (
    <footer className="border-t border-[#252525] bg-[#111111] text-white">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-8 md:grid-cols-2 md:items-start">
          {/* Site information */}
          <div>
            <p className="text-sm font-semibold text-white">
              Behind the Code
            </p>

            <p className="mt-2 max-w-md text-sm leading-6 text-[#a3a3a3]">
              A developer publishing platform for building, learning, and
              sharing through code.
            </p>
          </div>

          {/* Contact */}
          <div className="md:justify-self-end">
            <p className="text-sm font-semibold text-white">
              Get in touch
            </p>

            <p className="mt-2 text-sm leading-6 text-[#a3a3a3]">
              Have a question, idea, or collaboration in mind?
            </p>

            <a
              href="mailto:hello@rishavkamal.com"
              className="mt-3 inline-flex text-sm font-medium text-[#7d9fff] transition-colors hover:text-[#9ab4ff]"
            >
              rishavkamalbg821@gmail.com
            </a>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-[#252525] pt-6 text-sm text-[#777777] sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Rishav Kamal</p>

          <p>Built with Next.js</p>
        </div>
      </div>
    </footer>
  );
}