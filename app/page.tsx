"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";

const challenges = [
  ["AI Evaluation", "Find the better AI response", "8 min", "100 XP"],
  ["Prompt Engineering", "Break the model. Improve the prompt.", "12 min", "200 XP"],
  ["Python", "Debug a real data pipeline", "15 min", "150 XP"],
];

const skills = [
  ["AI Evaluation", 100],
  ["Prompt Engineering", 89],
  ["Data Analysis", 81],
  ["Python", 74],
];

const particles = [
  ["8%", "22%", "2px", 7],
  ["18%", "68%", "3px", 9],
  ["76%", "18%", "2px", 8],
  ["88%", "62%", "3px", 11],
  ["54%", "82%", "2px", 10],
  ["42%", "12%", "2px", 8],
  ["92%", "32%", "2px", 12],
  ["28%", "88%", "3px", 9],
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#030407] text-white">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <motion.div
          className="absolute left-[5%] top-[5%] h-[420px] w-[420px] rounded-full bg-cyan-500/10 blur-[140px]"
          animate={{
            x: [0, 80, -30, 0],
            y: [0, 50, -40, 0],
            scale: [1, 1.15, 0.9, 1],
          }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />

        <motion.div
          className="absolute right-[-5%] top-[20%] h-[520px] w-[520px] rounded-full bg-violet-600/10 blur-[160px]"
          animate={{
            x: [0, -70, 30, 0],
            y: [0, -50, 60, 0],
            scale: [1, 0.9, 1.15, 1],
          }}
          transition={{ duration: 17, repeat: Infinity, ease: "easeInOut" }}
        />

        <motion.div
          className="absolute bottom-[10%] left-[35%] h-[400px] w-[400px] rounded-full bg-blue-600/8 blur-[150px]"
          animate={{
            x: [-40, 50, -20, -40],
            y: [30, -40, 50, 30],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />

        {particles.map(([left, top, size, duration], index) => (
          <motion.span
            key={index}
            className="absolute rounded-full bg-cyan-300/70"
            style={{
              left,
              top,
              width: size,
              height: size,
            }}
            animate={{
              y: [0, -25, 0, 18, 0],
              x: [0, 12, -10, 8, 0],
              opacity: [0.15, 0.8, 0.25, 0.7, 0.15],
              scale: [1, 1.5, 0.8, 1.3, 1],
            }}
            transition={{
              duration: Number(duration),
              repeat: Infinity,
              ease: "easeInOut",
              delay: index * 0.4,
            }}
          />
        ))}
      </div>

      <Navbar />

      {/* HERO */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-24 pt-20 lg:px-8 lg:pb-32 lg:pt-28">
        <div className="grid items-center gap-16 lg:grid-cols-[1.05fr_.95fr]">
          <motion.div
            initial={{ opacity: 0, x: -60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
          >
            <motion.div
              className="mb-7 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/[0.06] px-4 py-2 text-xs font-medium text-cyan-300"
              initial={{ opacity: 0, y: -15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_14px_rgba(34,211,238,.9)]" />
              The proof-first hiring network
            </motion.div>

            <h1 className="max-w-4xl text-6xl font-semibold leading-[.92] tracking-[-0.055em] sm:text-7xl lg:text-[92px]">
              Your skills
              <br />
              <motion.span
                className="inline-block bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent"
                animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
              >
                need evidence.
              </motion.span>
            </h1>

            <motion.p
              className="mt-8 max-w-xl text-base leading-7 text-white/45 sm:text-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
            >
              PROOF turns what you can do into measurable evidence — through
              practical challenges, verified skills and real opportunities.
            </motion.p>

            <motion.div
              className="mt-10 flex flex-col gap-3 sm:flex-row"
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.5 }}
            >
              <Link
                href="/challenges"
                className="group rounded-full bg-white px-7 py-4 text-center font-semibold text-black transition duration-300 hover:-translate-y-2 hover:scale-[1.03] hover:shadow-[0_18px_60px_rgba(34,211,238,.18)]"
              >
                Prove your skills
                <span className="ml-2 inline-block transition group-hover:translate-x-1">
                  →
                </span>
              </Link>

              <Link
                href="/opportunities"
                className="rounded-full border border-white/10 bg-white/[0.04] px-7 py-4 text-center font-semibold text-white transition duration-300 hover:-translate-y-2 hover:scale-[1.03] hover:border-cyan-400/30 hover:bg-white/[0.07]"
              >
                Explore opportunities
              </Link>
            </motion.div>

            <motion.div
              className="mt-12 flex flex-wrap items-center gap-6 text-xs text-white/35"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.8 }}
            >
              <span>✓ Practical challenges</span>
              <span>✓ Skill evidence</span>
              <span>✓ Opportunity matching</span>
            </motion.div>
          </motion.div>

          {/* LIVE PROOF CARD */}
          <motion.div
            className="relative mx-auto w-full max-w-[520px]"
            initial={{ opacity: 0, x: 60, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 1, delay: 0.15, ease: "easeOut" }}
          >
            <div className="absolute -inset-8 rounded-[40px] bg-cyan-400/[0.06] blur-3xl" />

            <motion.div
              className="relative rounded-[32px] border border-white/10 bg-white/[0.045] p-5 shadow-2xl backdrop-blur-2xl"
              animate={{
                y: [0, -14, 0],
                rotateX: [0, 1.5, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <div className="rounded-[26px] border border-white/10 bg-[#080b10]/90 p-6">
                <div className="flex items-center justify-between border-b border-white/8 pb-5">
                  <div>
                    <p className="text-[10px] uppercase tracking-[.2em] text-white/30">
                      PROOF / SKILL PASSPORT
                    </p>
                    <h3 className="mt-2 text-2xl font-semibold">
                      Verified Candidate
                    </h3>
                  </div>

                  <motion.div
                    className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs text-emerald-300"
                    animate={{ opacity: [0.55, 1, 0.55] }}
                    transition={{ duration: 2.5, repeat: Infinity }}
                  >
                    ● Verified
                  </motion.div>
                </div>

                <div className="mt-7 space-y-5">
                  {skills.map(([name, score], index) => (
                    <div key={name}>
                      <div className="mb-2 flex justify-between text-sm">
                        <span className="text-white/65">{name}</span>
                        <span className="text-cyan-300">{score}</span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400"
                          initial={{ width: 0 }}
                          animate={{ width: `${score}%` }}
                          transition={{
                            duration: 1.2,
                            delay: 0.7 + index * 0.15,
                            ease: "easeOut",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 grid grid-cols-2 gap-3">
                  <motion.div
                    className="rounded-2xl border border-white/8 bg-white/[0.035] p-4"
                    whileHover={{ y: -5, scale: 1.03 }}
                  >
                    <p className="text-xs text-white/30">Challenges</p>
                    <p className="mt-1 text-2xl font-semibold">02</p>
                  </motion.div>

                  <motion.div
                    className="rounded-2xl border border-white/8 bg-white/[0.035] p-4"
                    whileHover={{ y: -5, scale: 1.03 }}
                  >
                    <p className="text-xs text-white/30">Best score</p>
                    <p className="mt-1 text-2xl font-semibold text-cyan-300">
                      100%
                    </p>
                  </motion.div>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="absolute -bottom-5 -left-5 rounded-2xl border border-white/10 bg-[#090c12]/95 px-5 py-4 shadow-2xl backdrop-blur-xl"
              animate={{
                y: [0, 8, 0],
                x: [0, 4, 0],
              }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <p className="text-[10px] uppercase tracking-widest text-white/30">
                Latest proof
              </p>
              <p className="mt-1 text-sm font-medium">AI Evaluation</p>
              <p className="mt-1 text-xs text-emerald-300">
                Score verified · 100
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* STATEMENT */}
      <motion.section
        className="relative z-10 border-y border-white/8 bg-white/[0.015]"
        initial={{ opacity: 0, y: 70 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.8 }}
      >
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <p className="text-sm uppercase tracking-[.25em] text-cyan-400">
            The idea
          </p>

          <h2 className="mt-5 max-w-5xl text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
            A resume tells people what you{" "}
            <span className="text-white/25">say</span>.
            <br />
            PROOF shows what you{" "}
            <span className="bg-gradient-to-r from-cyan-300 to-violet-400 bg-clip-text text-transparent">
              actually do.
            </span>
          </h2>
        </div>
      </motion.section>

      {/* CHALLENGES */}
      <motion.section
        id="challenges"
        className="relative z-10 mx-auto max-w-7xl px-6 py-28 lg:px-8"
        initial={{ opacity: 0, y: 80 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.8 }}
      >
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-cyan-400">01 / PROVE</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
              Test the skill.
            </h2>
            <p className="mt-4 max-w-xl text-white/40">
              Short, practical challenges designed around real work instead
              of memorized answers.
            </p>
          </div>

          <Link
            href="/challenges"
            className="text-sm text-white/45 transition hover:text-white"
          >
            Explore all challenges →
          </Link>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {challenges.map(([category, title, time, xp], index) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 45, scale: 0.96 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, delay: index * 0.12 }}
            >
              <Link
                href="/challenges"
                className="group block rounded-[28px] border border-white/8 bg-white/[0.025] p-7 transition duration-500 hover:-translate-y-4 hover:scale-[1.025] hover:border-cyan-400/25 hover:bg-white/[0.05] hover:shadow-[0_25px_80px_rgba(34,211,238,.08)]"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-cyan-400/[0.08] px-3 py-1 text-xs text-cyan-300">
                    {category}
                  </span>
                  <span className="text-xs text-white/25">0{index + 1}</span>
                </div>

                <h3 className="mt-12 text-2xl font-semibold leading-tight">
                  {title}
                </h3>

                <div className="mt-12 flex justify-between border-t border-white/8 pt-5 text-xs text-white/35">
                  <span>{time}</span>
                  <span>{xp}</span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* HOW IT WORKS */}
      <motion.section
        id="how-it-works"
        className="relative z-10 mx-auto max-w-7xl px-6 py-28 lg:px-8"
        initial={{ opacity: 0, y: 80 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.9 }}
      >
        <div className="rounded-[36px] border border-white/10 bg-gradient-to-br from-cyan-400/[0.06] via-white/[0.025] to-violet-500/[0.06] p-8 md:p-14">
          <div className="max-w-3xl">
            <p className="text-sm font-medium text-violet-300">
              02 / THE SYSTEM
            </p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight sm:text-6xl">
              From skill to proof.
              <br />
              From proof to opportunity.
            </h2>
          </div>

          <div className="mt-14 grid gap-px overflow-hidden rounded-3xl border border-white/8 bg-white/8 md:grid-cols-3">
            {[
              ["01", "Take a challenge", "Complete a practical task that measures a real skill."],
              ["02", "Build your passport", "Your strongest results become evidence on your profile."],
              ["03", "Get discovered", "Companies can find people based on demonstrated ability."],
            ].map(([number, title, text], index) => (
              <motion.div
                key={number}
                className="bg-[#080a0f] p-7 transition duration-500 hover:bg-[#0c1017]"
                initial={{ opacity: 0, y: 35 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.15 }}
                whileHover={{ y: -6 }}
              >
                <span className="text-sm text-cyan-400">{number}</span>
                <h3 className="mt-8 text-xl font-semibold">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-white/40">{text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* OPPORTUNITIES */}
      <motion.section
        id="opportunities"
        className="relative z-10 mx-auto max-w-7xl px-6 py-28 lg:px-8"
        initial={{ opacity: 0, y: 80 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.9 }}
      >
        <div className="mb-12">
          <p className="text-sm font-medium text-blue-400">03 / DISCOVER</p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
            Opportunities that see the proof.
          </h2>
        </div>

        <div className="space-y-3">
          {[
            ["AI Response Evaluator", "AI Labs", "AI Evaluation · LLM · Reasoning", "JOB"],
            ["Junior Data Analyst", "Nova Systems", "Python · SQL · Data Analysis", "JOB"],
            ["Prompt Engineering Intern", "Future AI", "Prompting · LLMs · Testing", "INTERNSHIP"],
          ].map(([title, company, skillsText, type], index) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, x: -45 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, delay: index * 0.12 }}
            >
              <Link
                href="/opportunities"
                className="group flex flex-col gap-5 rounded-3xl border border-white/8 bg-white/[0.025] p-6 transition duration-500 hover:-translate-y-2 hover:scale-[1.01] hover:border-cyan-400/20 hover:bg-white/[0.05] hover:shadow-[0_20px_70px_rgba(34,211,238,.06)] md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <div className="flex gap-3 text-xs">
                    <span className="text-cyan-300">{type}</span>
                    <span className="text-white/20">•</span>
                    <span className="text-white/35">{company}</span>
                  </div>
                  <h3 className="mt-3 text-xl font-semibold">{title}</h3>
                  <p className="mt-2 text-sm text-white/35">{skillsText}</p>
                </div>

                <span className="text-sm text-white/35 transition group-hover:text-cyan-300">
                  View opportunity →
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* FINAL CTA */}
      <motion.section
        className="relative z-10 mx-auto max-w-7xl px-6 py-32 text-center lg:px-8"
        initial={{ opacity: 0, scale: 0.94, y: 60 }}
        whileInView={{ opacity: 1, scale: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 1 }}
      >
        <div className="mx-auto max-w-4xl">
          <p className="text-sm font-medium uppercase tracking-[.25em] text-cyan-400">
            Don&apos;t just apply.
          </p>

          <h2 className="mt-5 text-5xl font-semibold tracking-[-.04em] sm:text-7xl">
            Build something
            <br />
            <span className="bg-gradient-to-r from-cyan-300 to-violet-400 bg-clip-text text-transparent">
              worth proving.
            </span>
          </h2>

          <p className="mx-auto mt-6 max-w-xl text-white/40">
            Start with one challenge. Build your evidence. Let your skills
            speak for themselves.
          </p>

          <motion.div whileHover={{ scale: 1.06, y: -5 }} whileTap={{ scale: 0.97 }}>
            <Link
              href="/auth"
              className="mt-10 inline-flex rounded-full bg-white px-8 py-4 font-semibold text-black shadow-[0_10px_40px_rgba(34,211,238,.08)] transition hover:shadow-[0_20px_70px_rgba(34,211,238,.2)]"
            >
              Start building your proof →
            </Link>
          </motion.div>
        </div>
      </motion.section>

      <footer className="relative z-10 border-t border-white/8 px-6 py-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 text-sm text-white/25 sm:flex-row">
          <span>
            PROOF<span className="text-cyan-400">.</span>
          </span>
          <span>Don&apos;t just apply. Prove yourself.</span>
        </div>
      </footer>
    </main>
  );
}
