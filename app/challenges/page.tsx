"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

type Challenge = {
  id: string;
  title: string;
  description: string | null;
  difficulty: string;
  duration_minutes: number;
  xp: number;
};

export default function ChallengesPage() {
  const supabase = createClient();

  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadChallenges() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/auth";
        return;
      }

      const { data, error } = await supabase
        .from("challenges")
        .select(
          "id, title, description, difficulty, duration_minutes, xp"
        )
        .eq("published", true)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("PROOF challenges error:", error);
      }

      setChallenges(data ?? []);
      setLoading(false);
    }

    loadChallenges();
  }, [supabase]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#030407] text-white">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <motion.div
            className="mx-auto mb-5 h-10 w-10 rounded-full border-2 border-cyan-400/20 border-t-cyan-400"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <p className="text-sm text-white/40">Loading challenges...</p>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#030407] text-white">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <motion.div
          className="absolute -left-32 top-20 h-[420px] w-[420px] rounded-full bg-cyan-500/10 blur-[140px]"
          animate={{
            x: [0, 70, -25, 0],
            y: [0, 45, -35, 0],
            scale: [1, 1.15, 0.92, 1],
          }}
          transition={{
            duration: 14,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        <motion.div
          className="absolute right-[-100px] top-[30%] h-[500px] w-[500px] rounded-full bg-violet-600/10 blur-[160px]"
          animate={{
            x: [0, -70, 35, 0],
            y: [0, -40, 55, 0],
            scale: [1, 0.9, 1.15, 1],
          }}
          transition={{
            duration: 17,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:70px_70px] [mask-image:linear-gradient(to_bottom,black,transparent_90%)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 py-8 lg:px-8">
        {/* NAV */}
        <motion.header
          className="mb-16 flex items-center justify-between"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <Link
            href="/"
            className="text-2xl font-bold tracking-tight transition hover:scale-105"
          >
            PROOF<span className="text-cyan-400">.</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm text-white/70 transition duration-300 hover:-translate-y-1 hover:bg-white/[0.08] hover:text-white"
            >
              Dashboard
            </Link>

            <Link
              href="/history"
              className="hidden rounded-full border border-cyan-400/20 bg-cyan-400/[0.07] px-5 py-2.5 text-sm text-cyan-300 transition duration-300 hover:-translate-y-1 hover:bg-cyan-400/[0.13] sm:block"
            >
              My History
            </Link>
          </div>
        </motion.header>

        {/* HERO */}
        <motion.section
          className="mb-14"
          initial={{ opacity: 0, y: 35 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="max-w-4xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/[0.06] px-4 py-2 text-xs font-medium text-cyan-300">
              <motion.span
                className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_14px_rgba(34,211,238,.8)]"
                animate={{
                  opacity: [0.4, 1, 0.4],
                  scale: [0.9, 1.25, 0.9],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              Skill challenges
            </div>

            <p className="text-sm uppercase tracking-[0.25em] text-white/35">
              PROOF / CHALLENGES
            </p>

            <h1 className="mt-4 text-5xl font-semibold tracking-[-0.045em] sm:text-7xl">
              Prove what
              <br />
              <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">
                you can do.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-7 text-white/40 sm:text-lg">
              Complete practical challenges, earn verified scores and build
              evidence that makes your Skill Passport stronger.
            </p>
          </div>

          <div className="mt-10 grid max-w-3xl gap-3 sm:grid-cols-3">
            {[
              ["01", "Take a challenge"],
              ["02", "Earn your score"],
              ["03", "Build your proof"],
            ].map(([number, text], index) => (
              <motion.div
                key={number}
                className="rounded-2xl border border-white/8 bg-white/[0.025] p-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.5,
                  delay: 0.25 + index * 0.1,
                }}
              >
                <span className="text-xs text-cyan-400">{number}</span>
                <p className="mt-2 text-sm text-white/55">{text}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* CHALLENGES */}
        {challenges.length === 0 ? (
          <motion.div
            className="rounded-[32px] border border-white/10 bg-white/[0.035] p-12 text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-white/40">No challenges available yet.</p>
          </motion.div>
        ) : (
          <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {challenges.map((challenge, index) => (
              <motion.div
                key={challenge.id}
                initial={{ opacity: 0, y: 55, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  duration: 0.6,
                  delay: index * 0.1,
                  ease: "easeOut",
                }}
                whileHover={{
                  y: -10,
                  scale: 1.015,
                }}
              >
                <Link
                  href={`/challenges/${challenge.id}`}
                  className="group relative block h-full overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.035] p-7 transition duration-500 hover:border-cyan-400/25 hover:bg-white/[0.055] hover:shadow-[0_25px_80px_rgba(34,211,238,.08)]"
                >
                  {/* Card glow */}
                  <motion.div
                    className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-cyan-400/[0.07] blur-3xl"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 0.9, 0.5],
                    }}
                    transition={{
                      duration: 5,
                      repeat: Infinity,
                      delay: index * 0.4,
                    }}
                  />

                  <div className="relative flex items-center justify-between">
                    <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs font-medium text-cyan-300">
                      {challenge.difficulty}
                    </span>

                    <span className="text-xs text-white/25">
                      0{index + 1}
                    </span>
                  </div>

                  <div className="relative mt-12">
                    <h2 className="text-2xl font-semibold leading-tight">
                      {challenge.title}
                    </h2>

                    <p className="mt-4 min-h-[72px] text-sm leading-6 text-white/40">
                      {challenge.description}
                    </p>
                  </div>

                  <div className="relative mt-8 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
                      <p className="text-[10px] uppercase tracking-widest text-white/25">
                        Time
                      </p>
                      <p className="mt-1 text-sm font-medium text-white/70">
                        {challenge.duration_minutes} min
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
                      <p className="text-[10px] uppercase tracking-widest text-white/25">
                        Reward
                      </p>
                      <p className="mt-1 text-sm font-medium text-cyan-300">
                        +{challenge.xp} XP
                      </p>
                    </div>
                  </div>

                  <div className="relative mt-5 flex items-center justify-between border-t border-white/8 pt-5">
                    <span className="text-xs text-white/30">
                      Practical skill test
                    </span>

                    <span className="flex items-center gap-2 text-sm font-medium text-white/55 transition group-hover:text-cyan-300">
                      Start
                      <motion.span
                        className="inline-block"
                        initial={{ x: 0 }}
                        whileHover={{ x: 5 }}
                      >
                        →
                      </motion.span>
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </section>
        )}

        {/* CTA */}
        <motion.section
          className="mt-16 overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-r from-cyan-400/[0.07] via-white/[0.025] to-violet-500/[0.07] p-8 sm:p-10"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="flex flex-col justify-between gap-7 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-cyan-300">
                Your proof compounds
              </p>
              <h2 className="mt-3 text-2xl font-semibold">
                Every challenge strengthens your profile.
              </h2>
              <p className="mt-2 text-sm text-white/35">
                Complete more challenges to make your skills easier to trust.
              </p>
            </div>

            <Link
              href="/passport"
              className="shrink-0 rounded-full bg-white px-6 py-3.5 text-center text-sm font-semibold text-black transition duration-300 hover:-translate-y-1 hover:scale-105 hover:shadow-[0_15px_50px_rgba(34,211,238,.18)]"
            >
              View Skill Passport →
            </Link>
          </div>
        </motion.section>

        <footer className="mt-16 border-t border-white/8 py-8">
          <div className="flex flex-col justify-between gap-3 text-sm text-white/25 sm:flex-row">
            <span>
              PROOF<span className="text-cyan-400">.</span>
            </span>
            <span>Don&apos;t just apply. Prove yourself.</span>
          </div>
        </footer>
      </div>
    </main>
  );
}
