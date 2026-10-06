"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Opportunity = {
  id: string;
  title: string;
};

type Question = {
  question_text: string;
  options: string[];
  correct_answer: string;
  points: number;
};

export default function NewHiringChallengePage() {
  const supabase = createClient();

  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [opportunityId, setOpportunityId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(20);
  const [passingScore, setPassingScore] = useState(70);
  const [questions, setQuestions] = useState<Question[]>([
    {
      question_text: "",
      options: ["", "", "", ""],
      correct_answer: "",
      points: 10,
    },
  ]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadOpportunities() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/auth";
        return;
      }

      const { data: company } = await supabase
        .from("companies")
        .select("id")
        .eq("owner_id", user.id)
        .limit(1)
        .maybeSingle();

      if (!company) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("opportunities")
        .select("id, title")
        .eq("company_id", company.id)
        .eq("status", "open")
        .order("created_at", { ascending: false });

      setOpportunities(data ?? []);

      if (data?.[0]) {
        setOpportunityId(data[0].id);
      }

      setLoading(false);
    }

    loadOpportunities();
  }, []);

  function updateQuestion(
    index: number,
    field: keyof Question,
    value: string | number | string[],
  ) {
    setQuestions((current) =>
      current.map((question, questionIndex) =>
        questionIndex === index
          ? { ...question, [field]: value }
          : question,
      ),
    );
  }

  function updateOption(
    questionIndex: number,
    optionIndex: number,
    value: string,
  ) {
    setQuestions((current) =>
      current.map((question, index) => {
        if (index !== questionIndex) return question;

        const options = [...question.options];
        options[optionIndex] = value;

        return { ...question, options };
      }),
    );
  }

  function addQuestion() {
    setQuestions((current) => [
      ...current,
      {
        question_text: "",
        options: ["", "", "", ""],
        correct_answer: "",
        points: 10,
      },
    ]);
  }

  function removeQuestion(index: number) {
    if (questions.length === 1) return;

    setQuestions((current) =>
      current.filter((_, questionIndex) => questionIndex !== index),
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!opportunityId) {
      setMessage("Select an opportunity first.");
      return;
    }

    if (!title.trim()) {
      setMessage("Enter a challenge title.");
      return;
    }

    const validQuestions = questions.filter(
      (question) =>
        question.question_text.trim() &&
        question.options.every((option) => option.trim()) &&
        question.correct_answer,
    );

    if (validQuestions.length !== questions.length) {
      setMessage("Complete every question, option and correct answer.");
      return;
    }

    setSaving(true);

    const { data: challenge, error: challengeError } = await supabase
      .from("hiring_challenges")
      .insert({
        opportunity_id: opportunityId,
        title: title.trim(),
        description: description.trim(),
        duration_minutes: duration,
        passing_score: passingScore,
        published: false,
      })
      .select("id")
      .single();

    if (challengeError || !challenge) {
      console.error(challengeError);
      setMessage("Could not create the challenge.");
      setSaving(false);
      return;
    }

    const questionRows = validQuestions.map((question, index) => ({
      hiring_challenge_id: challenge.id,
      question_text: question.question_text.trim(),
      question_type: "multiple_choice",
      options: question.options,
      correct_answer: question.correct_answer,
      points: question.points,
      question_order: index + 1,
    }));

    const { error: questionError } = await supabase
      .from("hiring_challenge_questions")
      .insert(questionRows);

    if (questionError) {
      await supabase
        .from("hiring_challenges")
        .delete()
        .eq("id", challenge.id);

      console.error(questionError);
      setMessage("Challenge was not saved because the questions failed.");
      setSaving(false);
      return;
    }

    window.location.href = "/company";
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#030407] text-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-cyan-400" />
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#030407] text-white">
      <div className="pointer-events-none fixed inset-0">
        <motion.div
          animate={{ x: [0, 80, -30, 0], y: [0, -40, 60, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-[8%] top-[8%] h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -60, 30, 0], y: [0, 50, -40, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
          className="absolute right-[8%] top-[30%] h-80 w-80 rounded-full bg-violet-500/10 blur-3xl"
        />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:48px_48px]" />
      </div>

      <div className="relative mx-auto max-w-5xl px-6 py-8 lg:px-8">
        <header className="flex items-center justify-between">
          <Link
            href="/company"
            className="text-2xl font-bold tracking-tight"
          >
            PROOF<span className="text-cyan-400">.</span>
          </Link>

          <Link
            href="/company"
            className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm text-white/60 transition hover:border-white/20 hover:text-white"
          >
            ← Company Workspace
          </Link>
        </header>

        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-14"
        >
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/60">
            PROOF Hiring Intelligence
          </p>

          <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
            Create a hiring challenge.
          </h1>

          <p className="mt-4 max-w-2xl text-white/40">
            Give candidates a practical way to prove their skills before the
            interview.
          </p>
        </motion.section>

        <form onSubmit={handleSubmit} className="mt-10 space-y-6">
          <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 backdrop-blur-xl md:p-8">
            <p className="text-xs uppercase tracking-[0.25em] text-white/30">
              Challenge setup
            </p>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="text-sm text-white/60">
                  Opportunity
                </label>
                <select
                  value={opportunityId}
                  onChange={(event) => setOpportunityId(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none transition focus:border-cyan-400/40"
                >
                  {opportunities.length === 0 && (
                    <option value="">No open opportunities</option>
                  )}

                  {opportunities.map((opportunity) => (
                    <option key={opportunity.id} value={opportunity.id}>
                      {opportunity.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="text-sm text-white/60">
                  Challenge title
                </label>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="AI Response Evaluation Challenge"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none transition placeholder:text-white/20 focus:border-cyan-400/40"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm text-white/60">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={4}
                  placeholder="What should candidates prove in this challenge?"
                  className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none transition placeholder:text-white/20 focus:border-cyan-400/40"
                />
              </div>

              <div>
                <label className="text-sm text-white/60">
                  Duration
                </label>
                <input
                  type="number"
                  min={5}
                  max={120}
                  value={duration}
                  onChange={(event) => setDuration(Number(event.target.value))}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-cyan-400/40"
                />
              </div>

              <div>
                <label className="text-sm text-white/60">
                  Passing score
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={passingScore}
                  onChange={(event) =>
                    setPassingScore(Number(event.target.value))
                  }
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-cyan-400/40"
                />
              </div>
            </div>
          </section>

          {questions.map((question, questionIndex) => (
            <motion.section
              key={questionIndex}
              layout
              className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 backdrop-blur-xl md:p-8"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-cyan-300/60">
                    Question {questionIndex + 1}
                  </p>
                  <p className="mt-1 text-sm text-white/30">
                    Multiple choice
                  </p>
                </div>

                {questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeQuestion(questionIndex)}
                    className="text-xs text-red-300/60 transition hover:text-red-300"
                  >
                    Remove
                  </button>
                )}
              </div>

              <textarea
                value={question.question_text}
                onChange={(event) =>
                  updateQuestion(
                    questionIndex,
                    "question_text",
                    event.target.value,
                  )
                }
                rows={3}
                placeholder="Write the question candidates need to solve..."
                className="mt-6 w-full resize-none rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none placeholder:text-white/20 focus:border-cyan-400/40"
              />

              <div className="mt-5">
                <div className="mb-3 flex items-center justify-between">
                  <label className="text-xs uppercase tracking-[0.18em] text-white/35">
                    Answer options
                  </label>
                  <span className="text-xs text-cyan-300/60">
                    4 choices required
                  </span>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  {question.options.map((option, optionIndex) => {
                    const letter = String.fromCharCode(65 + optionIndex);
                    const selected = question.correct_answer === option && option.trim();

                    return (
                      <button
                        key={optionIndex}
                        type="button"
                        onClick={() => {
                          if (option.trim()) {
                            updateQuestion(
                              questionIndex,
                              "correct_answer",
                              option,
                            );
                          }
                        }}
                        className={`group flex items-center gap-3 rounded-2xl border p-3 text-left transition ${
                          selected
                            ? "border-cyan-400/40 bg-cyan-400/[0.08]"
                            : "border-white/10 bg-black/20 hover:border-white/20"
                        }`}
                      >
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-semibold ${
                            selected
                              ? "bg-cyan-400 text-black"
                              : "bg-white/[0.05] text-white/40"
                          }`}
                        >
                          {letter}
                        </span>

                        <input
                          value={option}
                          onChange={(event) =>
                            updateOption(
                              questionIndex,
                              optionIndex,
                              event.target.value,
                            )
                          }
                          onClick={(event) => event.stopPropagation()}
                          placeholder={`Enter option ${letter}`}
                          className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/20"
                        />

                        <span
                          className={`text-[10px] ${
                            selected ? "text-cyan-300" : "text-white/20"
                          }`}
                        >
                          {selected ? "✓ Correct" : "Select"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-xs text-white/35">
                    Correct answer
                  </label>
                  <select
                    value={question.correct_answer}
                    onChange={(event) =>
                      updateQuestion(
                        questionIndex,
                        "correct_answer",
                        event.target.value,
                      )
                    }
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-cyan-400/40"
                  >
                    <option value="">Select correct option</option>
                    {question.options.map((option, optionIndex) => (
                      <option
                        key={optionIndex}
                        value={option}
                        disabled={!option.trim()}
                      >
                        Option {String.fromCharCode(65 + optionIndex)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-white/35">
                    Points
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={question.points}
                    onChange={(event) =>
                      updateQuestion(
                        questionIndex,
                        "points",
                        Number(event.target.value),
                      )
                    }
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-cyan-400/40"
                  />
                </div>
              </div>
            </motion.section>
          ))}

          <button
            type="button"
            onClick={addQuestion}
            className="w-full rounded-2xl border border-dashed border-cyan-400/20 bg-cyan-400/[0.03] px-5 py-4 text-sm text-cyan-300 transition hover:border-cyan-400/40 hover:bg-cyan-400/[0.06]"
          >
            + Add another question
          </button>

          {message && (
            <div className="rounded-2xl border border-red-400/20 bg-red-400/[0.05] px-5 py-4 text-sm text-red-300">
              {message}
            </div>
          )}

          <div className="flex flex-col justify-end gap-3 sm:flex-row">
            <Link
              href="/company"
              className="rounded-full border border-white/10 bg-white/[0.04] px-6 py-3 text-center text-sm text-white/60 transition hover:border-white/20 hover:text-white"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={saving || opportunities.length === 0}
              className="rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 px-7 py-3 text-sm font-semibold text-black transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {saving ? "Creating..." : "Create challenge"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
