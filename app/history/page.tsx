"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Attempt = {
  id: string;
  challenge_id: string;
  score: number;
  max_score: number;
  xp_earned: number;
  status: string;
  completed_at: string | null;
  challenge_title: string;
};

export default function HistoryPage() {
  const supabase = createClient();

  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/auth";
        return;
      }

      const { data, error } = await supabase
        .from("challenge_attempts")
        .select(
          "id, challenge_id, score, max_score, xp_earned, status, completed_at, challenges(title)"
        )
        .eq("user_id", user.id)
        .order("completed_at", { ascending: false });

      if (error) {
        console.error("PROOF history error:", error);
        setLoading(false);
        return;
      }

      const formatted = (data ?? []).map((attempt: any) => ({
        id: attempt.id,
        challenge_id: attempt.challenge_id,
        score: attempt.score ?? 0,
        max_score: attempt.max_score ?? 0,
        xp_earned: attempt.xp_earned ?? 0,
        status: attempt.status,
        completed_at: attempt.completed_at,
        challenge_title: attempt.challenges?.title ?? "Challenge",
      }));

      setAttempts(formatted);
      setLoading(false);
    }

    loadHistory();
  }, []);

  const totalXP = attempts.reduce(
    (total, attempt) => total + attempt.xp_earned,
    0
  );

  const bestScore = attempts.length
    ? Math.max(
        ...attempts.map((attempt) =>
          attempt.max_score
            ? Math.round((attempt.score / attempt.max_score) * 100)
            : 0
        )
      )
    : 0;

  return (
    <main className="min-h-screen bg-[#050507] text-white">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <header className="mb-12 flex items-center justify-between">
          <Link href="/" className="text-xl font-semibold">
            PROOF<span className="text-cyan-400">.</span>
          </Link>

          <Link
            href="/dashboard"
            className="rounded-full border border-white/10 px-5 py-2.5 text-sm text-white/70 hover:bg-white/[0.05]"
          >
            Dashboard
          </Link>
        </header>

        <section className="mb-10">
          <p className="text-sm uppercase tracking-[0.2em] text-cyan-400">
            Your Progress
          </p>

          <h1 className="mt-3 text-5xl font-semibold">
            Challenge History
          </h1>

          <p className="mt-4 text-white/50">
            Every challenge you complete becomes part of your proof.
          </p>
        </section>

        <section className="mb-10 grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <p className="text-sm text-white/40">Challenges Completed</p>
            <p className="mt-3 text-4xl font-semibold">{attempts.length}</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <p className="text-sm text-white/40">Total XP</p>
            <p className="mt-3 text-4xl font-semibold">{totalXP}</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <p className="text-sm text-white/40">Best Score</p>
            <p className="mt-3 text-4xl font-semibold">{bestScore}%</p>
          </div>
        </section>

        <section>
          {loading ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-white/40">
              Loading challenge history...
            </div>
          ) : attempts.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-10 text-center">
              <h2 className="text-xl font-semibold">
                No challenges completed yet
              </h2>

              <p className="mt-3 text-white/40">
                Take your first challenge and start building your proof.
              </p>

              <Link
                href="/challenges"
                className="mt-6 inline-block rounded-full bg-white px-6 py-3 text-sm font-medium text-black"
              >
                Explore Challenges
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {attempts.map((attempt) => {
                const percentage = attempt.max_score
                  ? Math.round((attempt.score / attempt.max_score) * 100)
                  : 0;

                return (
                  <Link
                    key={attempt.id}
                    href={`/challenges/${attempt.challenge_id}/result?score=${attempt.score}&max=${attempt.max_score}&xp=${attempt.xp_earned}`}
                    className="block rounded-3xl border border-white/10 bg-white/[0.04] p-6 transition hover:-translate-y-1 hover:bg-white/[0.06]"
                  >
                    <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                      <div>
                        <h2 className="text-lg font-semibold">
                          {attempt.challenge_title}
                        </h2>

                        <p className="mt-2 text-sm text-white/40">
                          {attempt.completed_at
                            ? new Date(
                                attempt.completed_at
                              ).toLocaleString()
                            : "Completed"}
                        </p>
                      </div>

                      <div className="flex items-center gap-8">
                        <div>
                          <p className="text-xs text-white/30">Score</p>
                          <p className="mt-1 text-xl font-semibold">
                            {attempt.score}/{attempt.max_score}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-white/30">Result</p>
                          <p className="mt-1 text-xl font-semibold">
                            {percentage}%
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-white/30">XP</p>
                          <p className="mt-1 text-xl font-semibold text-cyan-400">
                            +{attempt.xp_earned}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
