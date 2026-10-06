"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Question = {
  id: string;
  question_text: string;
  options: string[];
  points: number;
  question_order: number;
};

export default function HiringChallengePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = createClient();

  const [challengeId, setChallengeId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [passingScore, setPassingScore] = useState(70);
  const [secondsLeft, setSecondsLeft] = useState(1200);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [expired, setExpired] = useState(false);
  const [error, setError] = useState("");

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

      const { data: challenge, error: challengeError } = await supabase
        .from("hiring_challenges")
        .select("id, title, description, duration_minutes, passing_score, opportunity_id")
        .eq("id", id)
        .eq("published", true)
        .single();

      if (challengeError || !challenge) {
        setError(
          "This hiring challenge is not available. It may not be unlocked for your application yet.",
        );
        setLoading(false);
        return;
      }

      const { data: application } = await supabase
        .from("applications")
        .select("status")
        .eq("opportunity_id", challenge.opportunity_id)
        .eq("user_id", user.id)
        .maybeSingle();

      const eligibleStatuses = [
        "applied",
        "reviewing",
        "shortlisted",
        "interview",
        "hired",
      ];

      if (
        !application ||
        !eligibleStatuses.includes(application.status)
      ) {
        setError("This challenge is not available for your application.");
        setLoading(false);
        return;
      }

      const { data: questionData, error: questionError } =
        await supabase
          .from("hiring_challenge_questions")
          .select("id, question_text, options, points, question_order")
          .eq("hiring_challenge_id", id)
          .order("question_order", { ascending: true });

      if (questionError) {
        console.error("PROOF hiring questions error:", questionError);
        setError("Could not load the hiring challenge.");
        setLoading(false);
        return;
      }

      const duration = Number(challenge.duration_minutes ?? 20);

      setTitle(challenge.title);
      setDescription(challenge.description ?? "");
      setPassingScore(Number(challenge.passing_score ?? 70));
      setSecondsLeft(duration * 60);

      setQuestions(
        (questionData ?? []).map((question) => ({
          ...question,
          options: Array.isArray(question.options)
            ? question.options
            : [],
        })),
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

  async function submitChallenge() {
    if (expired) return;

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
        (answers[question.id] ===
        (question as Question & { correct_answer?: string })
          .correct_answer
          ? question.points
          : 0)
      );
    }, 0);

    const maxScore = questions.reduce(
      (total, question) => total + question.points,
      0,
    );

    const percentage =
      maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

    const { data: fullQuestions } = await supabase
      .from("hiring_challenge_questions")
      .select("id, correct_answer")
      .eq("hiring_challenge_id", challengeId);

    const correctMap = new Map(
      (fullQuestions ?? []).map((question) => [
        question.id,
        question.correct_answer,
      ]),
    );

    const finalScore = questions.reduce((total, question) => {
      return (
        total +
        (answers[question.id] === correctMap.get(question.id)
          ? question.points
          : 0)
      );
    }, 0);

    const finalPercentage =
      maxScore > 0 ? Math.round((finalScore / maxScore) * 100) : 0;

    const { data: attempt, error: attemptError } =
      await supabase
        .from("hiring_challenge_attempts")
        .upsert(
          {
            hiring_challenge_id: challengeId,
            user_id: user.id,
            score: finalScore,
            max_score: maxScore,
            status: "completed",
            completed_at: new Date().toISOString(),
          },
          {
            onConflict: "hiring_challenge_id,user_id",
          },
        )
        .select("id")
        .single();

    if (attemptError || !attempt) {
      console.error("PROOF hiring attempt error:", attemptError);
      alert("Could not save your hiring challenge attempt.");
      setSubmitting(false);
      return;
    }

    const answerRows = questions.map((question) => ({
      attempt_id: attempt.id,
      question_id: question.id,
      answer: answers[question.id],
      is_correct:
        answers[question.id] === correctMap.get(question.id),
      points_earned:
        answers[question.id] === correctMap.get(question.id)
          ? question.points
          : 0,
    }));

    const { error: answerError } = await supabase
      .from("hiring_challenge_answers")
      .upsert(answerRows, {
        onConflict: "attempt_id,question_id",
      });

    if (answerError) {
      console.error("PROOF hiring answers error:", answerError);
      alert("The score was saved, but some answers could not be saved.");
      setSubmitting(false);
      return;
    }

    window.location.href =
      `/hiring-challenges/${challengeId}/result?score=${finalScore}&max=${maxScore}&passing=${passingScore}&percentage=${finalPercentage}`;
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#030407] text-white">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-white/10 border-t-cyan-400" />
      </main>
    );
  }

  if (error || questions.length === 0) {
    return (
      <main className="min-h-screen bg-[#030407] px-6 py-20 text-white">
        <div className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-cyan-300/60">
            Hiring challenge
          </p>
          <h1 className="mt-4 text-3xl font-semibold">
            Challenge unavailable
          </h1>
          <p className="mt-4 text-sm leading-7 text-white/40">
            {error || "No questions are available for this challenge yet."}
          </p>
          <Link
            href="/opportunities"
            className="mt-7 inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-cyan-300"
          >
            Back to opportunities
          </Link>
        </div>
      </main>
    );
  }

  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  return (
    <main className="min-h-screen overflow-hidden bg-[#030407] text-white">
      <div className="pointer-events-none fixed inset-0">
        <motion.div
          animate={{ x: [0, 70, -30, 0], y: [0, -40, 50, 0] }}
          transition={{
            duration: 14,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute left-[8%] top-[8%] h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -60, 30, 0], y: [0, 50, -40, 0] }}
          transition={{
            duration: 16,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute right-[5%] top-[30%] h-96 w-96 rounded-full bg-violet-500/10 blur-3xl"
        />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-6 py-8 lg:px-8">
        <header className="flex items-center justify-between border-b border-white/8 pb-6">
          <Link href="/dashboard" className="text-2xl font-bold">
            PROOF<span className="text-cyan-400">.</span>
          </Link>

          <div
            className={`rounded-full border px-4 py-2 text-sm font-semibold ${
              secondsLeft <= 60
                ? "border-red-400/30 bg-red-400/10 text-red-300"
                : "border-white/10 bg-white/[0.04] text-white/70"
            }`}
          >
            {String(minutes).padStart(2, "0")}:
            {String(seconds).padStart(2, "0")}
          </div>
        </header>

        <section className="py-10">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/60">
                Company hiring challenge
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                {title}
              </h1>
              {description && (
                <p className="mt-3 max-w-2xl text-sm leading-7 text-white/40">
                  {description}
                </p>
              )}
            </div>

            <div className="text-left md:text-right">
              <p className="text-xs text-white/30">
                {answeredCount}/{questions.length} answered
              </p>
              <p className="mt-1 text-sm text-white/50">
                Passing score: {passingScore}%
              </p>
            </div>
          </div>

          <div className="mt-7 h-1.5 overflow-hidden rounded-full bg-white/8">
            <motion.div
              animate={{
                width: `${((currentIndex + 1) / questions.length) * 100}%`,
              }}
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-500"
            />
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_260px]">
            <div className="min-w-0">
              <AnimatePresence mode="wait">
                <motion.section
                  key={currentQuestion.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 backdrop-blur-xl sm:p-8"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-[0.2em] text-white/30">
                      Question {currentIndex + 1}
                    </span>
                    <span className="text-xs text-cyan-300/60">
                      {currentQuestion.points} pts
                    </span>
                  </div>

                  <h2 className="mt-6 text-xl font-medium leading-8 sm:text-2xl">
                    {currentQuestion.question_text}
                  </h2>

                  <div className="mt-8 space-y-3">
                    {currentQuestion.options.map((option, index) => {
                      const selected =
                        answers[currentQuestion.id] === option;

                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() =>
                            selectAnswer(currentQuestion.id, option)
                          }
                          className={`group flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition ${
                            selected
                              ? "border-cyan-400/40 bg-cyan-400/[0.08]"
                              : "border-white/10 bg-black/10 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.04]"
                          }`}
                        >
                          <span
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-semibold ${
                              selected
                                ? "bg-cyan-400 text-black"
                                : "bg-white/[0.05] text-white/40"
                            }`}
                          >
                            {String.fromCharCode(65 + index)}
                          </span>

                          <span className="text-sm leading-6 text-white/70">
                            {option}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-8 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentIndex((current) =>
                          Math.max(0, current - 1),
                        )
                      }
                      disabled={currentIndex === 0}
                      className="rounded-full border border-white/10 px-5 py-2.5 text-sm text-white/50 transition hover:border-white/20 hover:text-white disabled:opacity-30"
                    >
                      ← Previous
                    </button>

                    {currentIndex < questions.length - 1 ? (
                      <button
                        type="button"
                        onClick={() =>
                          setCurrentIndex((current) =>
                            Math.min(
                              questions.length - 1,
                              current + 1,
                            ),
                          )
                        }
                        className="rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-black transition hover:bg-cyan-300"
                      >
                        Next →
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={submitChallenge}
                        disabled={submitting || expired}
                        className="rounded-full bg-cyan-400 px-6 py-2.5 text-sm font-semibold text-black transition hover:bg-cyan-300 disabled:opacity-50"
                      >
                        {submitting ? "Submitting..." : "Submit challenge"}
                      </button>
                    )}
                  </div>
                </motion.section>
              </AnimatePresence>
            </div>

            <aside className="h-fit rounded-3xl border border-white/10 bg-white/[0.025] p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-white/30">
                Questions
              </p>

              <div className="mt-5 grid grid-cols-5 gap-2">
                {questions.map((question, index) => {
                  const answered = Boolean(answers[question.id]);

                  return (
                    <button
                      key={question.id}
                      type="button"
                      onClick={() => setCurrentIndex(index)}
                      className={`flex h-10 items-center justify-center rounded-xl text-xs font-medium transition ${
                        index === currentIndex
                          ? "bg-cyan-400 text-black"
                          : answered
                            ? "bg-cyan-400/15 text-cyan-300"
                            : "bg-white/[0.05] text-white/35 hover:bg-white/[0.08]"
                      }`}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>

              <div className="mt-7 border-t border-white/8 pt-5">
                <p className="text-xs leading-6 text-white/30">
                  Answer every question before submitting. Your result will
                  be shared with the company as part of your hiring process.
                </p>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}
