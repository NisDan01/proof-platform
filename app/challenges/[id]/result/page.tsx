"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function ChallengeResultPage() {
  const searchParams = useSearchParams();

  const [score, setScore] = useState(0);
  const [maxScore, setMaxScore] = useState(0);
  const [xp, setXp] = useState(0);

  useEffect(() => {
    setScore(Number(searchParams.get("score") ?? 0));
    setMaxScore(Number(searchParams.get("max") ?? 0));
    setXp(Number(searchParams.get("xp") ?? 0));
  }, [searchParams]);

  const percentage =
    maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

  const passed = percentage >= 70;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#030407] text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <motion.div
          animate={{
            x: [0, 100, -50, 0],
            y: [0, -60, 40, 0],
            scale: [1, 1.2, 0.9, 1],
          }}
          transition={{
            duration: 16,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute left-[10%] top-[5%] h-96 w-96 rounded-full bg-cyan-500/10 blur-[120px]"
        />

        <motion.div
          animate={{
            x: [0, -80, 40, 0],
            y: [0, 50, -40, 0],
            scale: [1, 0.85, 1.15, 1],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute bottom-[5%] right-[5%] h-96 w-96 rounded-full bg-violet-500/10 blur-[120px]"
        />

        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:70px_70px]" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-7 sm:px-8">
        <header className="flex items-center justify-between">
          <Link
            href="/"
            className="text-xl font-bold tracking-tight"
          >
            PROOF<span className="text-cyan-400">.</span>
          </Link>

          <Link
            href="/dashboard"
            className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/60 backdrop-blur transition hover:bg-white/[0.08] hover:text-white"
          >
            Dashboard
          </Link>
        </header>

        <div className="flex flex-1 items-center justify-center py-14">
          <motion.div
            initial={{ opacity: 0, y: 35 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-2xl text-center"
          >
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                delay: 0.15,
                duration: 0.6,
                type: "spring",
              }}
              className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full border text-3xl ${
                passed
                  ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-300"
                  : "border-white/10 bg-white/[0.05] text-white/50"
              }`}
            >
              {passed ? "✓" : "!"}
            </motion.div>

            <p className="mt-7 text-xs font-semibold uppercase tracking-[0.35em] text-cyan-400">
              Challenge complete
            </p>

            <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
              {passed ? "You proved it." : "Keep building proof."}
            </h1>

            <p className="mx-auto mt-4 max-w-lg leading-7 text-white/40">
              Your challenge has been evaluated and your PROOF profile
              has been updated.
            </p>

            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.35, duration: 0.5 }}
              className="mt-10 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-8"
            >
              <div className="flex flex-col items-center justify-center">
                <div className="relative flex h-48 w-48 items-center justify-center">
                  <svg
                    className="absolute inset-0 h-full w-full -rotate-90"
                    viewBox="0 0 100 100"
                  >
                    <circle
                      cx="50"
                      cy="50"
                      r="43"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="4"
                      className="text-white/5"
                    />

                    <motion.circle
                      cx="50"
                      cy="50"
                      r="43"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="4"
                      strokeLinecap="round"
                      className="text-cyan-400"
                      strokeDasharray={270}
                      initial={{ strokeDashoffset: 270 }}
                      animate={{
                        strokeDashoffset:
                          270 - (270 * percentage) / 100,
                      }}
                      transition={{
                        duration: 1.2,
                        delay: 0.4,
                        ease: "easeOut",
                      }}
                    />
                  </svg>

                  <div>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.7 }}
                      className="text-5xl font-semibold tracking-tight"
                    >
                      {percentage}%
                    </motion.p>

                    <p className="mt-1 text-xs uppercase tracking-widest text-white/30">
                      Score
                    </p>
                  </div>
                </div>

                <div className="mt-7 grid w-full grid-cols-2 gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-4">
                    <p className="text-xs uppercase tracking-wider text-white/30">
                      Score
                    </p>
                    <p className="mt-2 text-xl font-semibold">
                      {score}/{maxScore}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-4">
                    <p className="text-xs uppercase tracking-wider text-white/30">
                      XP earned
                    </p>
                    <p className="mt-2 text-xl font-semibold text-cyan-300">
                      +{xp}
                    </p>
                  </div>

                  <div className="col-span-2 rounded-2xl border border-white/8 bg-white/[0.025] p-4 sm:col-span-1">
                    <p className="text-xs uppercase tracking-wider text-white/30">
                      Status
                    </p>
                    <p
                      className={`mt-2 text-xl font-semibold ${
                        passed
                          ? "text-cyan-300"
                          : "text-white/60"
                      }`}
                    >
                      {passed ? "Verified" : "Keep going"}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65 }}
              className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center"
            >
              <Link
                href="/passport"
                className="rounded-2xl bg-white px-7 py-3.5 text-sm font-semibold text-black transition hover:bg-cyan-300"
              >
                View Skill Passport →
              </Link>

              <Link
                href="/challenges"
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-7 py-3.5 text-sm font-medium text-white/70 transition hover:bg-white/[0.08] hover:text-white"
              >
                Take another challenge
              </Link>
            </motion.div>

            <p className="mt-8 text-xs text-white/25">
              Your best verified scores become part of your PROOF.
            </p>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
