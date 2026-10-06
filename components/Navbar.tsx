import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-8">
      <Link href="/" className="text-2xl font-bold tracking-tight">
        PROOF<span className="text-cyan-400">.</span>
      </Link>

      <div className="hidden items-center gap-8 text-sm text-white/50 md:flex">
        <Link
          href="#challenges"
          className="transition hover:text-white"
        >
          Challenges
        </Link>

        <Link
          href="#opportunities"
          className="transition hover:text-white"
        >
          Opportunities
        </Link>

        <Link
          href="#passport"
          className="transition hover:text-white"
        >
          Skill Passport
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/auth"
          className="hidden px-3 py-2 text-sm text-white/60 transition hover:text-white sm:block"
        >
          Sign in
        </Link>

        <Link
          href="/auth"
          className="rounded-full border border-white/15 bg-white/8 px-5 py-2.5 text-sm font-medium backdrop-blur transition hover:border-cyan-400/30 hover:bg-white/12"
        >
          Get started
        </Link>
      </div>
    </nav>
  );
}
