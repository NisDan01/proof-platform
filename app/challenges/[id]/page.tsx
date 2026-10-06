"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Question = {
  id: string;
  question_text: string;
  options: string[];
  correct_answer: string;
  points: number;
  question_order: number;
};

const letters = ["A", "B", "C", "D"];

export default function ChallengePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = createClient();

  const [challengeId, setChallengeId] = useState("");
  const [title, setTitle] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(10);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(600);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    async function loadChallenge() {
      const { id } = await params;

      setChallengeId(id);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/auth";
        return;
      }

      const { data: challenge, error: challengeError } =
        await supabase
          .from("challenges")
          .select("title, duration_minutes")
          .eq("id", id)
          .single();

      if (challengeError) {
        console.error("PROOF challenge error:", challengeError);
      }

      const { data: questionData, error: questionError } =
        await supabase
          .from("challenge_questions")
          .select(
            "id, question_text, options, correct_answer, points, question_order"
          )
          .eq("challenge_id", id)
          .order("question_order", { ascending: true });

      if (questionError) {
        console.error("PROOF questions error:", questionError);
      }

      const duration = Number(challenge?.duration_minutes ?? 10);

      setTitle(challenge?.title ?? "Challenge");
      setDurationMinutes(duration);
      setSecondsLeft(duration * 60);

      setQuestions(
        (questionData ?? []).map((question) => ({
          ...question,
          options: Array.isArray(question.options)
            ? question.options
            : [],
        }))
      );

      setLoading(false);
    }

    loadChallenge();
  }, [params, supabase]);

  useEffect(() => {
    if (loading || submitting || expired || questions.length === 0) {
      return;
    }

    if (secondsLeft <= 0) {
      setExpired(true);
      return;
    }

    const timer = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [loading, submitting, expired, questions.length, secondsLeft]);

  function selectAnswer(questionId: string, answer: string) {
    if (expired || submitting) return;

    setAnswers((current) => ({
      ...current,
      [questionId]: answer,
    }));
  }

  function goNext() {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((current) => current + 1);
    }
  }

  function goPrevious() {
    if (currentIndex > 0) {
      setCurrentIndex((current) => current - 1);
    }
  }

  async function submitChallenge() {
    if (questions.some((question) => !answers[question.id])) {
      alert("Please answer all questions before submitting.");
      return;
    }

    setSubmitting(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/auth";
      return;
    }

    const score = questions.reduce((total, question) => {
      return (
        total +
        (answers[question.id] === question.correct_answer
          ? question.points
          : 0)
      );
    }, 0);

    const maxScore = questions.reduce(
      (total, question) => total + question.points,
      0
    );

    const xpEarned =
      maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

    const { data: attempt, error: attemptError } =
      await supabase
        .from("challenge_attempts")
        .insert({
          challenge_id: challengeId,
          user_id: user.id,
          score,
          max_score: maxScore,
          xp_earned: xpEarned,
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .select("id")
        .single();

    if (attemptError || !attempt) {
      console.error("PROOF attempt error:", attemptError);
      alert("Could not save your attempt. Please try again.");
      setSubmitting(false);
      return;
    }

    const answerRows = questions.map((question) => ({
      attempt_id: attempt.id,
      question_id: question.id,
      answer: answers[question.id],
      is_correct:
        answers[question.id] === question.correct_answer,
      points_earned:
        answers[question.id] === question.correct_answer
          ? question.points
          : 0,
    }));

    const { error: answerError } = await supabase
      .from("challenge_answers")
      .insert(answerRows);

    if (answerError) {
      console.error("PROOF answers error:", answerError);
      alert("Your attempt was saved, but answers could not be saved.");
      setSubmitting(false);
      return;
    }

    const { error: skillError } = await supabase.rpc(
      "update_skill_from_challenge",
      {
        p_attempt_id: attempt.id,
      }
    );

    if (skillError) {
      console.error("PROOF skill update error:", skillError);
      alert(
        "Challenge completed, but Skill Passport could not be updated."
      );
      setSubmitting(false);
      return;
    }

    window.location.href =
      `/challenges/${challengeId}/result?score=${score}&max=${maxScore}&xp=${xpEarned}`;
  }

  const currentQuestion = questions[currentIndex];
  const answeredCount = questions.filter(
    (question) => answers[question.id]
  ).length;

  const progress =
    questions.length > 0
      ? ((currentIndex + 1) / questions.length) * 100
      : 0;

  const minutes = Math.floor(secondsLeft / 60)
    .toString()
    .padStart(2, "0");

  const seconds = (secondsLeft % 60)
    .toString()
    .padStart(2, "0");

  const timerDanger = secondsLeft <= 60;

  if (loading) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#030407] text-white">
        <div className="absolute left-1/2 top-1/3 h-96 w-96 -translate-x-1/2 rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="relative flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-cyan-400" />
          <p className="text-sm text-white/50">
            Preparing your challenge...
          </p>
        </div>
      </main>
    );
  }

  if (expired) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[#030407] px-6 py-12 text-white">
        <div className="pointer-events-none absolute left-1/2 top-20 h-96 w-96 -translate-x-1/2 rounded-full bg-red-500/10 blur-[120px]" />

        <div className="relative mx-auto flex min-h-[80vh] max-w-2xl items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 text-center backdrop-blur-xl sm:p-12"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-red-400/20 bg-red-400/10 text-2xl">
              ⏱
            </div>

            <p className="mt-6 text-sm font-medium uppercase tracking-[0.25em] text-red-300">
              Time expired
            </p>

            <h1 className="mt-3 text-3xl font-semibold">
              Challenge paused
            </h1>

            <p className="mx-auto mt-4 max-w-md leading-7 text-white/50">
              Your time limit has ended. Your answers were not submitted
              automatically.
            </p>

            <Link
              href="/challenges"
              className="mt-8 inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-cyan-300"
            >
              Back to challenges
            </Link>
          </motion.div>
        </div>
      </main>
    );
  }

  if (!currentQuestion) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#030407] text-white">
        <p className="text-white/50">No questions found.</p>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#030407] text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <motion.div
          animate={{
            x: [0, 80, -30, 0],
            y: [0, -40, 50, 0],
            scale: [1, 1.15, 0.95, 1],
          }}
          transition={{
            duration: 14,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute left-[8%] top-[8%] h-80 w-80 rounded-full bg-cyan-500/10 blur-[110px]"
        />

        <motion.div
          animate={{
            x: [0, -70, 40, 0],
            y: [0, 60, -30, 0],
            scale: [1, 0.9, 1.12, 1],
          }}
          transition={{
            duration: 17,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute bottom-[5%] right-[5%] h-96 w-96 rounded-full bg-violet-500/10 blur-[120px]"
        />

        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:70px_70px]" />
      </div>

      <div className="relative mx-auto max-w-5xl px-5 py-6 sm:px-8 sm:py-10">
        <header className="mb-8 flex items-center justify-between">
          <Link
            href="/challenges"
            className="text-xl font-bold tracking-tight"
          >
            PROOF<span className="text-cyan-400">.</span>
          </Link>

          <div
            className={`flex items-center gap-3 rounded-full border px-4 py-2 text-sm font-semibold backdrop-blur-xl ${
              timerDanger
                ? "border-red-400/30 bg-red-400/10 text-red-300"
                : "border-white/10 bg-white/[0.04] text-white/70"
            }`}
          >
            <span className="text-base">◷</span>
            <span className="font-mono">
              {minutes}:{seconds}
            </span>
          </div>
        </header>

        <section className="mb-8">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-400">
                Skill challenge
              </p>

              <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                {title}
              </h1>

              <p className="mt-2 text-sm text-white/40">
                {durationMinutes} minute assessment · {questions.length}{" "}
                questions
              </p>
            </div>

            <div className="text-left sm:text-right">
              <p className="text-xs uppercase tracking-widest text-white/30">
                Progress
              </p>
              <p className="mt-1 text-sm font-medium text-white/70">
                {answeredCount}/{questions.length} answered
              </p>
            </div>
          </div>

          <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-white/10">
            <motion.div
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.35 }}
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-500"
            />
          </div>
        </section>

        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-white/40">
            Question{" "}
            <span className="font-semibold text-white">
              {currentIndex + 1}
            </span>{" "}
            of {questions.length}
          </p>

          <div className="flex gap-1.5">
            {questions.map((question, index) => (
              <button
                key={question.id}
                onClick={() => setCurrentIndex(index)}
                aria-label={`Go to question ${index + 1}`}
                className={`h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? "w-7 bg-cyan-400"
                    : answers[question.id]
                      ? "w-2 bg-white/50"
                      : "w-2 bg-white/15"
                }`}
              />
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, x: 25 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -25 }}
            transition={{ duration: 0.25 }}
            className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-10"
          >
            <div className="flex items-start gap-4">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-sm font-bold text-cyan-300"
              >
                {String(currentIndex + 1).padStart(2, "0")}
              </motion.div>

              <h2 className="pt-1 text-lg font-medium leading-7 text-white sm:text-xl sm:leading-8">
                {currentQuestion.question_text}
              </h2>
            </div>

            <div className="mt-8 grid gap-3">
              {currentQuestion.options.map((option, optionIndex) => {
                const selected =
                  answers[currentQuestion.id] === option;

                return (
                  <motion.button
                    key={option}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() =>
                      selectAnswer(currentQuestion.id, option)
                    }
                    className={`group flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all ${
                      selected
                        ? "border-cyan-400/50 bg-cyan-400/10 shadow-lg shadow-cyan-500/5"
                        : "border-white/10 bg-white/[0.025] hover:border-white/20 hover:bg-white/[0.05]"
                    }`}
                  >
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-sm font-semibold transition ${
                        selected
                          ? "border-cyan-400/40 bg-cyan-400/20 text-cyan-300"
                          : "border-white/10 bg-white/[0.04] text-white/40 group-hover:text-white/70"
                      }`}
                    >
                      {letters[optionIndex] ?? optionIndex + 1}
                    </span>

                    <span
                      className={`flex-1 text-sm leading-6 ${
                        selected
                          ? "text-white"
                          : "text-white/60"
                      }`}
                    >
                      {option}
                    </span>

                    <AnimatePresence>
                      {selected && (
                        <motion.span
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="text-cyan-300"
                        >
                          ✓
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            onClick={goPrevious}
            disabled={currentIndex === 0}
            className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-3.5 text-sm font-medium text-white/60 transition hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          >
            ← Previous
          </button>

          {currentIndex < questions.length - 1 ? (
            <button
              onClick={goNext}
              className="rounded-2xl bg-white px-7 py-3.5 text-sm font-semibold text-black transition hover:bg-cyan-300"
            >
              Next question →
            </button>
          ) : (
            <button
              onClick={submitChallenge}
              disabled={submitting || answeredCount !== questions.length}
              className="rounded-2xl bg-gradient-to-r from-cyan-300 to-blue-400 px-7 py-3.5 text-sm font-semibold text-black transition hover:from-cyan-200 hover:to-blue-300 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting
                ? "Verifying your skills..."
                : "Submit challenge ✓"}
            </button>
          )}
        </div>

        <p className="mt-8 text-center text-xs text-white/25">
          Your answers are scored automatically and successful challenges
          update your Skill Passport.
        </p>
      </div>
    </main>
  );
}
