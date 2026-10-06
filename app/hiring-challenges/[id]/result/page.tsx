"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function HiringChallengeResultPage({
  searchParams,
}: {
  searchParams: Promise<{
    score?: string;
    max?: string;
    passing?: string;
    percentage?: string;
  }>;
}) {
  const [result, setResult] = useState({
    score: 0,
    max: 0,
    passing: 70,
    percentage: 0,
  });

  useEffect(() => {
    searchParams.then((params) => {
      setResult({
        score: Number(params.score ?? 0),
        max: Number(params.max ?? 0),
        passing: Number(params.passing ?? 70),
        percentage: Number(params.percentage ?? 0),
      });
    });
  }, [searchParams]);

  const passed = result.percentage >= result.passing;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#030407] text-white">
      <div className="pointer-events-none fixed inset-0">
        <motion.div
          animate={{
            x: [0, 80, -40, 0],
            y: [0, -50, 40, 0],
          }}
          transition={{
            duration: 14,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute left-[10%] top-[8%] h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl"
        />

        <motion.div
          animate={{
            x: [0, -70, 30, 0],
            y: [0, 50, -30, 0],
          }}
          transition={{
            duration: 16,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute right-[5%] top-[35%] h-96 w-96 rounded-full bg-violet-500/10 blur-3xl"
        />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-4xl items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full"
        >
          <div className="mb-8 flex items-center justify-between">
            <Link href="/dashboard" className="text-2xl font-bold">
              PROOF<span className="text-cyan-400">.</span>
            </Link>

            <span className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/40">
              Challenge complete
            </span>
          </div>

          <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.035] p-8 text-center shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-12">
            <div
              className={`absolute left-1/2 top-0 h-48 w-48 -translate-x-1/2 rounded-full blur-3xl ${
                passed ? "bg-cyan-400/10" : "bg-violet-400/10"
              }`}
            />

            <div className="relative">
              <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  delay: 0.15,
                  duration: 0.5,
                  type: "spring",
                }}
                className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full border ${
                  passed
                    ? "border-cyan-400/30 bg-cyan-400/10"
                    : "border-violet-400/30 bg-violet-400/10"
                }`}
              >
                <span
                  className={`text-3xl font-semibold ${
                    passed ? "text-cyan-300" : "text-violet-300"
                  }`}
                >
                  {passed ? "✓" : "!"}
                </span>
              </motion.div>

              <p className="mt-7 text-xs uppercase tracking-[0.3em] text-white/30">
                Your hiring challenge result
              </p>

              <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
                {passed ? "Strong work." : "Challenge completed."}
              </h1>

              <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-white/40">
                {passed
                  ? "You cleared the required score. Your result is now part of your application and can be reviewed by the company."
                  : "Your challenge has been submitted. The company can review your result as part of the hiring process."}
              </p>

              <div className="mx-auto mt-10 max-w-xl rounded-3xl border border-white/10 bg-black/20 p-7">
                <div className="flex items-end justify-center gap-2">
                  <motion.span
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className={`text-7xl font-semibold tracking-tight ${
                      passed ? "text-cyan-300" : "text-white"
                    }`}
                  >
                    {result.percentage}
                  </motion.span>

                  <span className="pb-3 text-2xl text-white/30">%</span>
                </div>

                <p className="mt-2 text-sm text-white/30">
                  {result.score} / {result.max} points
                </p>

                <div className="mt-7 h-2 overflow-hidden rounded-full bg-white/8">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${Math.min(result.percentage, 100)}%`,
                    }}
                    transition={{
                      delay: 0.4,
                      duration: 0.8,
                      ease: "easeOut",
                    }}
                    className={`h-full rounded-full ${
                      passed
                        ? "bg-gradient-to-r from-cyan-400 to-violet-500"
                        : "bg-gradient-to-r from-violet-400 to-fuchsia-500"
                    }`}
                  />
                </div>

                <div className="mt-5 flex items-center justify-between text-xs">
                  <span className="text-white/30">
                    Passing score
                  </span>
                  <span className="font-medium text-white/60">
                    {result.passing}%
                  </span>
                </div>
              </div>

              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Link
                  href="/applications"
                  className="rounded-full bg-white px-7 py-3 text-sm font-semibold text-black transition hover:bg-cyan-300"
                >
                  View my application
                </Link>

                <Link
                  href="/opportunities"
                  className="rounded-full border border-white/10 bg-white/[0.03] px-7 py-3 text-sm font-medium text-white/60 transition hover:border-white/20 hover:text-white"
                >
                  Explore opportunities
                </Link>
              </div>

              <p className="mt-7 text-xs text-white/20">
                PROOF keeps your challenge result attached to this
                application for company review.
              </p>
            </div>
          </section>
        </motion.div>
      </div>
    </main>
  );
}
