const challenges = [
  {
    category: "AI Evaluation",
    title: "Find the better AI response",
    level: "Intermediate",
    time: "8 min",
    score: "100 XP",
  },
  {
    category: "Python",
    title: "Debug a real data pipeline",
    level: "Intermediate",
    time: "15 min",
    score: "150 XP",
  },
  {
    category: "Prompt Engineering",
    title: "Break the model. Improve the prompt.",
    level: "Advanced",
    time: "12 min",
    score: "200 XP",
  },
];

const opportunities = [
  {
    type: "PROJECT",
    title: "AI Response Evaluator",
    company: "AI Labs",
    skills: "AI Evaluation · LLM · Reasoning",
  },
  {
    type: "JOB",
    title: "Junior Data Analyst",
    company: "Nova Systems",
    skills: "Python · SQL · Data Analysis",
  },
  {
    type: "INTERNSHIP",
    title: "Prompt Engineering Intern",
    company: "Future AI",
    skills: "Prompting · LLMs · Testing",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#050509] text-white">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 -z-0 overflow-hidden">
        <div className="proof-glow absolute left-[10%] top-[8%] h-80 w-80 rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="proof-glow absolute right-[5%] top-[30%] h-96 w-96 rounded-full bg-violet-500/10 blur-[140px]" />
        <div className="absolute bottom-0 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-500/5 blur-[120px]" />
      </div>

      {/* Navbar */}
      <nav className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-8">
        <a href="#" className="text-2xl font-bold tracking-tight">
          PROOF<span className="text-cyan-400">.</span>
        </a>

        <div className="hidden items-center gap-8 text-sm text-white/50 md:flex">
          <a href="#challenges" className="transition hover:text-white">
            Challenges
          </a>
          <a href="#opportunities" className="transition hover:text-white">
            Opportunities
          </a>
          <a href="#passport" className="transition hover:text-white">
            Skill Passport
          </a>
        </div>

        <div className="flex items-center gap-3">
          <button className="hidden px-3 py-2 text-sm text-white/60 transition hover:text-white sm:block">
            Sign in
          </button>

          <button className="rounded-full border border-white/15 bg-white/8 px-5 py-2.5 text-sm font-medium backdrop-blur transition hover:border-cyan-400/30 hover:bg-white/12">
            Get started
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 mx-auto flex min-h-[78vh] max-w-7xl items-center px-6 py-24 lg:px-8">
        <div className="max-w-4xl">
          <div className="proof-float mb-7 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/5 px-4 py-2 text-sm text-cyan-300">
            <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.9)]" />
            The proof-first hiring network
          </div>

          <h1 className="text-5xl font-semibold leading-[0.98] tracking-[-0.04em] sm:text-7xl lg:text-[88px]">
            Skills speak
            <br />
            <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">
              louder than resumes.
            </span>
          </h1>

          <p className="mt-8 max-w-2xl text-base leading-7 text-white/50 sm:text-lg">
            Take real challenges. Build verified skills. Create your Skill
            Passport. Then connect with opportunities based on what you can
            actually do.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <button className="group rounded-full bg-white px-7 py-4 font-semibold text-black transition duration-300 hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(255,255,255,0.15)]">
              Prove your skills
              <span className="ml-2 inline-block transition group-hover:translate-x-1">
                →
              </span>
            </button>

            <button className="rounded-full border border-white/12 bg-white/[0.04] px-7 py-4 font-semibold text-white backdrop-blur transition duration-300 hover:border-white/25 hover:bg-white/[0.08]">
              Explore opportunities
            </button>
          </div>

          {/* Stats */}
          <div className="mt-16 flex flex-wrap gap-x-12 gap-y-6 border-t border-white/8 pt-7">
            <div>
              <p className="text-2xl font-semibold">12K+</p>
              <p className="mt-1 text-xs text-white/35">Skills verified</p>
            </div>

            <div>
              <p className="text-2xl font-semibold">3.8K+</p>
              <p className="mt-1 text-xs text-white/35">Challenges completed</p>
            </div>

            <div>
              <p className="text-2xl font-semibold">420+</p>
              <p className="mt-1 text-xs text-white/35">Opportunities</p>
            </div>
          </div>
        </div>
      </section>

      {/* Challenges */}
      <section id="challenges" className="relative z-10 mx-auto max-w-7xl px-6 py-24 lg:px-8">
        <div className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-cyan-400">PROVE YOURSELF</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Take a challenge.
            </h2>
            <p className="mt-3 max-w-xl text-white/40">
              Short, practical challenges designed to measure real ability.
            </p>
          </div>

          <button className="text-sm text-white/50 transition hover:text-white">
            View all challenges →
          </button>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {challenges.map((challenge) => (
            <article
              key={challenge.title}
              className="group rounded-3xl border border-white/8 bg-white/[0.025] p-6 backdrop-blur-xl transition duration-500 hover:-translate-y-2 hover:border-cyan-400/20 hover:bg-white/[0.05]"
            >
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-cyan-400/8 px-3 py-1 text-xs text-cyan-300">
                  {challenge.category}
                </span>

                <span className="text-xs text-white/30">
                  {challenge.score}
                </span>
              </div>

              <h3 className="mt-8 text-xl font-semibold leading-snug">
                {challenge.title}
              </h3>

              <div className="mt-8 flex items-center justify-between border-t border-white/8 pt-5 text-xs text-white/35">
                <span>{challenge.level}</span>
                <span>{challenge.time}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Skill Passport */}
      <section id="passport" className="relative z-10 mx-auto max-w-7xl px-6 py-24 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-violet-400">SKILL PASSPORT</p>

            <h2 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
              Your skills.
              <br />
              <span className="text-white/40">Backed by proof.</span>
            </h2>

            <p className="mt-6 max-w-lg leading-7 text-white/45">
              Every challenge becomes part of your professional identity.
              Instead of saying you have a skill, show the evidence.
            </p>

            <button className="mt-8 rounded-full border border-white/12 bg-white/[0.04] px-6 py-3 text-sm font-medium transition hover:bg-white/[0.08]">
              See how it works →
            </button>
          </div>

          <div className="relative rounded-[32px] border border-white/10 bg-white/[0.035] p-7 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-white/8 pb-6">
              <div>
                <p className="text-xs text-white/35">SKILL PASSPORT</p>
                <h3 className="mt-1 text-xl font-semibold">Verified Profile</h3>
              </div>

              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/8 px-3 py-1 text-xs text-emerald-300">
                Verified
              </span>
            </div>

            <div className="mt-7 space-y-6">
              {[
                ["AI Evaluation", 87],
                ["Prompt Engineering", 89],
                ["Python", 74],
                ["Data Analysis", 81],
              ].map(([skill, score]) => (
                <div key={skill}>
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="text-white/70">{skill}</span>
                    <span className="text-cyan-300">{score}</span>
                  </div>

                  <div className="h-1.5 overflow-hidden rounded-full bg-white/8">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-400"
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Opportunities */}
      <section id="opportunities" className="relative z-10 mx-auto max-w-7xl px-6 py-24 lg:px-8">
        <div className="mb-10">
          <p className="text-sm font-medium text-blue-400">OPPORTUNITIES</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Find work that fits your proof.
          </h2>
        </div>

        <div className="space-y-4">
          {opportunities.map((opportunity) => (
            <article
              key={opportunity.title}
              className="group flex flex-col gap-5 rounded-3xl border border-white/8 bg-white/[0.025] p-6 transition duration-300 hover:border-white/15 hover:bg-white/[0.05] md:flex-row md:items-center md:justify-between"
            >
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs font-medium text-cyan-300">
                    {opportunity.type}
                  </span>
                  <span className="text-xs text-white/25">•</span>
                  <span className="text-xs text-white/35">
                    {opportunity.company}
                  </span>
                </div>

                <h3 className="mt-3 text-xl font-semibold">
                  {opportunity.title}
                </h3>

                <p className="mt-2 text-sm text-white/35">
                  {opportunity.skills}
                </p>
              </div>

              <button className="shrink-0 rounded-full border border-white/10 px-5 py-2.5 text-sm transition group-hover:border-cyan-400/30 group-hover:bg-cyan-400/5">
                View opportunity →
              </button>
            </article>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 py-32 text-center lg:px-8">
        <div className="mx-auto max-w-3xl">
          <p className="text-sm font-medium text-cyan-400">THE FUTURE OF HIRING</p>

          <h2 className="mt-4 text-4xl font-semibold tracking-tight sm:text-6xl">
            Stop being another application.
            <br />
            <span className="text-white/40">Become the proof.</span>
          </h2>

          <button className="mt-10 rounded-full bg-white px-8 py-4 font-semibold text-black transition hover:scale-[1.02] hover:shadow-[0_0_50px_rgba(255,255,255,0.15)]">
            Start building your proof →
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/8 px-6 py-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 text-sm text-white/30 sm:flex-row">
          <span>
            PROOF<span className="text-cyan-400">.</span>
          </span>
          <span>Don&apos;t just apply. Prove yourself.</span>
        </div>
      </footer>
    </main>
  );
}
