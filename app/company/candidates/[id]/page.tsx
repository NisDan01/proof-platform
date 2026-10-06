"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  calculateMatchScore,
  getMatchLabel,
} from "@/lib/matching";

type Profile = {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
};

type Skill = {
  id: string;
  name: string;
  description: string | null;
  score: number;
  verified: boolean;
};

type RequiredSkill = {
  skill_id: string;
  name: string;
  required_score: number;
};

type Attempt = {
  id: string;
  score: number;
  max_score: number;
  xp_earned: number;
  completed_at: string | null;
  challenges:
    | { title: string }
    | { title: string }[]
    | null;
};

type HiringAttempt = {
  id: string;
  score: number;
  max_score: number;
  completed_at: string | null;
  status: string;
  hiring_challenges:
    | {
        title: string;
        passing_score: number;
      }
    | {
        title: string;
        passing_score: number;
      }[]
    | null;
};

export default function CandidateProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = createClient();

  const [candidateId, setCandidateId] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [hiringAttempts, setHiringAttempts] = useState<HiringAttempt[]>([]);
  const [application, setApplication] = useState<{
    id: string;
    status: string;
    opportunity_id: string;
    opportunity_title: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [matchScore, setMatchScore] = useState(0);
  const [matchLabel, setMatchLabel] = useState("No match data");
  const [requiredSkills, setRequiredSkills] = useState<RequiredSkill[]>([]);
  const [recruiterNotes, setRecruiterNotes] = useState<
    { id: string; note: string; created_at: string }[]
  >([]);
  const [newNote, setNewNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageSent, setMessageSent] = useState(false);
  const [candidateMessages, setCandidateMessages] = useState<
    { id: string; message: string; sender_id: string; created_at: string }[]
  >([]);

  useEffect(() => {
    async function loadCandidate() {
      const { id } = await params;
      setCandidateId(id);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/auth";
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, full_name, username, avatar_url")
        .eq("id", id)
        .single();

      if (!profileData) {
        setLoading(false);
        return;
      }

      setProfile(profileData);

      const { data: skillData } = await supabase
        .from("user_skills")
        .select(
          `
            id,
            score,
            verified,
            skills (
              id,
              name,
              description
            )
          `
        )
        .eq("user_id", id)
        .order("score", { ascending: false });

      const formattedSkills: Skill[] = (skillData ?? [])
        .map((item) => {
          const skill = Array.isArray(item.skills)
            ? item.skills[0]
            : item.skills;

          if (!skill) return null;

          return {
            id: skill.id,
            name: skill.name,
            description: skill.description,
            score: item.score,
            verified: item.verified,
          };
        })
        .filter(Boolean) as Skill[];

      setSkills(formattedSkills);

      const { data: attemptData } = await supabase
        .from("challenge_attempts")
        .select(
          `
            id,
            score,
            max_score,
            xp_earned,
            completed_at,
            challenges (
              title
            )
          `
        )
        .eq("user_id", id)
        .eq("status", "completed")
        .order("completed_at", { ascending: false })
        .limit(10);

      setAttempts(
        (attemptData ?? []) as unknown as Attempt[]
      );

      const { data: hiringAttemptData } = await supabase
        .from("hiring_challenge_attempts")
        .select(
          `
            id,
            score,
            max_score,
            completed_at,
            status,
            hiring_challenges (
              title,
              passing_score
            )
          `
        )
        .eq("user_id", id)
        .eq("status", "completed")
        .order("completed_at", { ascending: false });

      setHiringAttempts(
        (hiringAttemptData ?? []) as unknown as HiringAttempt[]
      );

      const { data: companyData } = await supabase
        .from("companies")
        .select("id")
        .eq("owner_id", user.id)
        .limit(1)
        .maybeSingle();

      if (companyData) {
        const { data: notesData } = await supabase
          .from("recruiter_notes")
          .select("id, note, created_at")
          .eq("company_id", companyData.id)
          .eq("candidate_id", id)
          .order("created_at", { ascending: false });

        setRecruiterNotes(notesData ?? []);
      }

      const { data: applicationData } = await supabase
        .from("applications")
        .select(
          `
            id,
            status,
            opportunity_id,
            opportunities (
              title
            )
          `
        )
        .eq("user_id", id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (applicationData) {
        const opportunity = Array.isArray(applicationData.opportunities)
          ? applicationData.opportunities[0]
          : applicationData.opportunities;

        setApplication({
          id: applicationData.id,
          status: applicationData.status,
          opportunity_id: applicationData.opportunity_id,
          opportunity_title: opportunity?.title ?? "Opportunity",
        });

        const { data: requiredSkills } = await supabase
          .from("opportunity_skills")
          .select("skill_id, required_score")
          .eq("opportunity_id", applicationData.opportunity_id);

        const requiredSkillIds = (requiredSkills ?? []).map(
          (skill) => skill.skill_id
        );

        const { data: skillDetails } =
          requiredSkillIds.length > 0
            ? await supabase
                .from("skills")
                .select("id, name")
                .in("id", requiredSkillIds)
            : { data: [] };

        const skillNames = new Map(
          (skillDetails ?? []).map((skill) => [skill.id, skill.name])
        );

        const formattedRequiredSkills = (requiredSkills ?? []).map(
          (skill) => ({
            skill_id: skill.skill_id,
            name: skillNames.get(skill.skill_id) ?? "Skill",
            required_score: skill.required_score ?? 0,
          })
        );

        setRequiredSkills(formattedRequiredSkills);

        const score = calculateMatchScore(
          formattedSkills.map((skill) => ({
            skill_id: skill.id,
            score: skill.score,
            verified: skill.verified,
          })),
          formattedRequiredSkills.map((skill) => ({
            skill_id: skill.skill_id,
            required_score: skill.required_score,
          }))
        );

        setMatchScore(score);
        setMatchLabel(
          (requiredSkills ?? []).length > 0
            ? getMatchLabel(score)
            : "No requirements"
        );
      }

      await loadCandidateMessages(id);
      setLoading(false);
    }

    loadCandidate();
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#030407] text-white">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-cyan-400" />
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#030407] text-white">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">
            Candidate not found
          </h1>
          <Link
            href="/company"
            className="mt-5 inline-block text-sm text-cyan-300"
          >
            ← Back to company
          </Link>
        </div>
      </main>
    );
  }

  const verifiedSkills = skills.filter(
    (skill) => skill.verified
  );

  const averageScore =
    skills.length > 0
      ? Math.round(
          skills.reduce((sum, skill) => sum + skill.score, 0) /
            skills.length
        )
      : 0;

  const totalXp = attempts.reduce(
    (sum, attempt) => sum + attempt.xp_earned,
    0
  );

  async function sendCandidateMessage() {
    const message = messageText.trim();
    if (!message || sendingMessage) return;

    setSendingMessage(true);
    setMessageSent(false);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSendingMessage(false);
      return;
    }

    const { data: companyData } = await supabase
      .from("companies")
      .select("id")
      .eq("owner_id", user.id)
      .limit(1)
      .maybeSingle();

    if (!companyData) {
      setSendingMessage(false);
      return;
    }

    const { data: conversation, error: conversationError } = await supabase
      .from("conversations")
      .upsert(
        {
          candidate_id: candidateId,
          company_id: companyData.id,
        },
        {
          onConflict: "candidate_id,company_id",
        }
      )
      .select("id")
      .single();

    if (conversationError || !conversation) {
      console.error(
        "PROOF conversation creation error:",
        conversationError
      );
      setSendingMessage(false);
      return;
    }

    const { error: messageError } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversation.id,
        sender_id: user.id,
        message,
        is_read: false,
      });

    if (!messageError) {
      setMessageText("");
      setMessageSent(true);
      await loadCandidateMessages();
    } else {
      console.error(
        "PROOF message send error:",
        messageError
      );
    }

    setSendingMessage(false);
  }

  async function loadCandidateMessages(candidateIdToLoad: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !candidateIdToLoad) return;

    const { data: companyData } = await supabase
      .from("companies")
      .select("id")
      .eq("owner_id", user.id)
      .limit(1)
      .maybeSingle();

    if (!companyData) return;

    const { data: conversation, error: conversationError } =
      await supabase
        .from("conversations")
        .select("id")
        .eq("company_id", companyData.id)
        .eq("candidate_id", candidateIdToLoad)
        .maybeSingle();

    if (conversationError) {
      console.error(
        "PROOF conversation load error:",
        conversationError
      );
      return;
    }

    if (!conversation) {
      setCandidateMessages([]);
      return;
    }

    const { data, error } = await supabase
      .from("messages")
      .select("id, message, sender_id, created_at")
      .eq("conversation_id", conversation.id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error(
        "PROOF candidate messages load error:",
        error
      );
      return;
    }

    setCandidateMessages(data ?? []);
  }

  async function addRecruiterNote() {
    const note = newNote.trim();
    if (!note || savingNote) return;

    setSavingNote(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSavingNote(false);
      return;
    }

    const { data: companyData } = await supabase
      .from("companies")
      .select("id")
      .eq("owner_id", user.id)
      .limit(1)
      .maybeSingle();

    if (!companyData) {
      setSavingNote(false);
      return;
    }

    const { data, error } = await supabase
      .from("recruiter_notes")
      .insert({
        company_id: companyData.id,
        candidate_id: candidateId,
        author_id: user.id,
        note,
      })
      .select("id, note, created_at")
      .single();

    if (!error && data) {
      setRecruiterNotes((current) => [data, ...current]);
      setNewNote("");
    }

    setSavingNote(false);
  }

  const skillsMeetingRequirements = requiredSkills.filter((requiredSkill) => {
    const candidateSkill = skills.find(
      (skill) => skill.id === requiredSkill.skill_id
    );
    return (candidateSkill?.score ?? 0) >= requiredSkill.required_score;
  }).length;

  const latestHiringAttempt = hiringAttempts[0];
  const latestHiringChallenge = latestHiringAttempt
    ? Array.isArray(latestHiringAttempt.hiring_challenges)
      ? latestHiringAttempt.hiring_challenges[0]
      : latestHiringAttempt.hiring_challenges
    : null;

  const hiringChallengePercentage = latestHiringAttempt
    ? latestHiringAttempt.max_score > 0
      ? Math.round(
          (latestHiringAttempt.score / latestHiringAttempt.max_score) * 100
        )
      : 0
    : null;

  const initials = (profile.full_name || "Candidate")
    .split(" ")
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#030407] text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <motion.div
          animate={{
            x: [0, 90, -40, 0],
            y: [0, -50, 40, 0],
            scale: [1, 1.15, 0.9, 1],
          }}
          transition={{
            duration: 17,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute left-[5%] top-[5%] h-96 w-96 rounded-full bg-cyan-500/10 blur-[120px]"
        />

        <motion.div
          animate={{
            x: [0, -70, 40, 0],
            y: [0, 60, -30, 0],
            scale: [1, 0.9, 1.1, 1],
          }}
          transition={{
            duration: 19,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute bottom-[5%] right-[0%] h-96 w-96 rounded-full bg-violet-500/10 blur-[120px]"
        />

        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:70px_70px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-5 py-7 sm:px-8">
        <header className="flex items-center justify-between border-b border-white/8 pb-6">
          <Link
            href="/"
            className="text-2xl font-bold tracking-tight"
          >
            PROOF<span className="text-cyan-400">.</span>
          </Link>

          <Link
            href="/company"
            className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/60 transition hover:bg-white/[0.08] hover:text-white"
          >
            ← Company dashboard
          </Link>
        </header>

        <section className="py-12">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-7 backdrop-blur-xl sm:p-10">
            <div className="flex flex-col gap-7 sm:flex-row sm:items-center">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt=""
                  className="h-24 w-24 rounded-3xl object-cover"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-cyan-400/20 to-violet-500/20 text-2xl font-semibold text-cyan-300">
                  {initials}
                </div>
              )}

              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-400">
                    Candidate profile
                  </p>

                  {verifiedSkills.length > 0 && (
                    <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[10px] font-semibold text-cyan-300">
                      ✓ PROOF VERIFIED
                    </span>
                  )}
                </div>

                <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">
                  {profile.full_name || "PROOF Candidate"}
                </h1>

                {profile.username && (
                  <p className="mt-2 text-sm text-white/30">
                    @{profile.username}
                  </p>
                )}

                <p className="mt-4 max-w-xl text-sm leading-6 text-white/40">
                  A proof-first candidate profile built from verified
                  practical skills and completed challenges.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="rounded-3xl border border-cyan-400/15 bg-cyan-400/[0.05] px-7 py-5 text-center">
                  <p className="text-xs uppercase tracking-widest text-white/30">
                    Overall proof
                  </p>
                  <p className="mt-2 text-4xl font-semibold text-cyan-300">
                    {averageScore}
                  </p>
                  <p className="mt-1 text-xs text-white/30">
                    average score
                  </p>
                </div>

                <div className="min-w-[190px] rounded-3xl border border-violet-400/15 bg-violet-400/[0.05] px-6 py-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-white/30">
                        PROOF Match
                      </p>
                      <p className="mt-1 text-xs text-white/35">
                        {matchLabel}
                      </p>
                    </div>

                    <span className="text-3xl font-semibold text-violet-300">
                      {matchScore}%
                    </span>
                  </div>

                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/8">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${matchScore}%` }}
                      transition={{ duration: 1, delay: 0.2 }}
                      className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          {[
            ["Verified skills", verifiedSkills.length],
            ["Challenges", attempts.length],
            ["XP earned", totalXp],
          ].map(([label, value], index) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.07 }}
              className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 backdrop-blur-xl"
            >
              <p className="text-xs text-white/30">{label}</p>
              <p className="mt-3 text-3xl font-semibold">{value}</p>
            </motion.div>
          ))}
        </section>

        {requiredSkills.length > 0 && (
          <section className="mt-8 rounded-[2rem] border border-cyan-400/10 bg-cyan-400/[0.025] p-6 backdrop-blur-xl sm:p-8">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-cyan-300/60">
                  PROOF Intelligence
                </p>
                <h2 className="mt-2 text-2xl font-semibold">
                  Why this candidate matches
                </h2>
                <p className="mt-2 text-sm text-white/35">
                  Skill requirements compared with demonstrated candidate evidence.
                </p>
              </div>

              <div className="text-left sm:text-right">
                <p className="text-3xl font-semibold text-cyan-300">
                  {matchScore}%
                </p>
                <p className="mt-1 text-xs text-white/30">
                  {matchLabel}
                </p>
              </div>
            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-4">
                <p className="text-[10px] uppercase tracking-[0.18em] text-white/25">
                  Skills coverage
                </p>
                <p className="mt-2 text-2xl font-semibold text-cyan-300">
                  {skillsMeetingRequirements}/{requiredSkills.length}
                </p>
                <p className="mt-1 text-xs text-white/30">
                  requirements met
                </p>
              </div>

              <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-4">
                <p className="text-[10px] uppercase tracking-[0.18em] text-white/25">
                  Hiring challenge
                </p>
                <p className="mt-2 text-2xl font-semibold text-violet-300">
                  {hiringChallengePercentage !== null
                    ? `${hiringChallengePercentage}%`
                    : "—"}
                </p>
                <p className="mt-1 text-xs text-white/30">
                  {latestHiringChallenge
                    ? hiringChallengePercentage! >=
                      latestHiringChallenge.passing_score
                      ? "Passed"
                      : "Below passing"
                    : "Not completed"}
                </p>
              </div>

              <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-4">
                <p className="text-[10px] uppercase tracking-[0.18em] text-white/25">
                  Application
                </p>
                <p className="mt-2 text-2xl font-semibold capitalize text-white">
                  {application?.status ?? "—"}
                </p>
                <p className="mt-1 text-xs text-white/30">
                  current decision stage
                </p>
              </div>
            </div>

            <div className="mt-7 space-y-4">
              {requiredSkills.map((requiredSkill, index) => {
                const candidateSkill = skills.find(
                  (skill) => skill.id === requiredSkill.skill_id
                );

                const candidateScore = candidateSkill?.score ?? 0;
                const meetsRequirement =
                  candidateScore >= requiredSkill.required_score;

                return (
                  <motion.div
                    key={requiredSkill.skill_id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.07 }}
                    className="rounded-2xl border border-white/8 bg-white/[0.025] p-5"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-medium">
                          {requiredSkill.name}
                        </p>
                        <p className="mt-1 text-xs text-white/30">
                          Required minimum: {requiredSkill.required_score}/100
                        </p>
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                          meetsRequirement
                            ? "bg-cyan-400/10 text-cyan-300"
                            : "bg-amber-400/10 text-amber-300"
                        }`}
                      >
                        {meetsRequirement ? "✓ Meets" : "⚠ Below"}
                      </span>
                    </div>

                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/8">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: `${Math.min(candidateScore, 100)}%`,
                        }}
                        transition={{
                          duration: 0.8,
                          delay: 0.12 + index * 0.07,
                        }}
                        className={`h-full rounded-full ${
                          meetsRequirement
                            ? "bg-cyan-400"
                            : "bg-amber-400"
                        }`}
                      />
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs">
                      <span className="text-white/25">
                        Candidate evidence
                      </span>
                      <span
                        className={
                          meetsRequirement
                            ? "text-cyan-300"
                            : "text-amber-300"
                        }
                      >
                        {candidateScore}/100
                        {candidateSkill?.verified ? " · Verified" : ""}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </section>
        )}

        {hiringAttempts.length > 0 && (
          <section className="mt-8 rounded-[2rem] border border-violet-400/15 bg-gradient-to-br from-violet-400/[0.07] to-cyan-400/[0.04] p-6 backdrop-blur-xl sm:p-8">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-violet-300/60">
                  Hiring challenge
                </p>
                <h2 className="mt-2 text-2xl font-semibold">
                  Practical screening result
                </h2>
                <p className="mt-2 text-sm text-white/35">
                  Evidence from the company&apos;s practical hiring challenge.
                </p>
              </div>

              <span className="rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1.5 text-xs font-semibold text-violet-300">
                {hiringAttempts.length} completed
              </span>
            </div>

            <div className="mt-7 space-y-3">
              {hiringAttempts.map((attempt, index) => {
                const challenge = Array.isArray(attempt.hiring_challenges)
                  ? attempt.hiring_challenges[0]
                  : attempt.hiring_challenges;

                const percentage =
                  attempt.max_score > 0
                    ? Math.round(
                        (attempt.score / attempt.max_score) * 100
                      )
                    : 0;

                const passed =
                  percentage >= (challenge?.passing_score ?? 70);

                return (
                  <motion.div
                    key={attempt.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.06 }}
                    className="rounded-2xl border border-white/8 bg-black/20 p-5"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold">
                          {challenge?.title ?? "Hiring challenge"}
                        </p>
                        <p className="mt-1 text-xs text-white/30">
                          {attempt.score}/{attempt.max_score} points
                          {challenge?.passing_score
                            ? ` · ${challenge.passing_score}% required`
                            : ""}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            passed
                              ? "bg-cyan-400/10 text-cyan-300"
                              : "bg-amber-400/10 text-amber-300"
                          }`}
                        >
                          {passed ? "✓ Passed" : "Below passing"}
                        </span>

                        <span className="text-2xl font-semibold text-white">
                          {percentage}%
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/8">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.8, delay: 0.12 }}
                        className="h-full rounded-full bg-gradient-to-r from-violet-400 to-cyan-400"
                      />
                    </div>

                    {attempt.completed_at && (
                      <p className="mt-3 text-xs text-white/25">
                        Completed{" "}
                        {new Date(attempt.completed_at).toLocaleDateString()}
                      </p>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </section>
        )}

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 backdrop-blur-xl sm:p-8">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-white/30">
                Skill passport
              </p>
              <h2 className="mt-2 text-2xl font-semibold">
                Demonstrated ability
              </h2>
            </div>

            <div className="mt-7 space-y-5">
              {skills.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-white/30">
                  No verified skills yet.
                </div>
              ) : (
                skills.map((skill, index) => (
                  <motion.div
                    key={skill.id}
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.06 }}
                    className="rounded-2xl border border-white/8 bg-white/[0.025] p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-medium">
                            {skill.name}
                          </h3>

                          {skill.verified && (
                            <span className="rounded-full bg-cyan-400/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-300">
                              ✓ Verified
                            </span>
                          )}
                        </div>

                        {skill.description && (
                          <p className="mt-2 text-xs leading-5 text-white/30">
                            {skill.description}
                          </p>
                        )}
                      </div>

                      <span className="text-2xl font-semibold">
                        {skill.score}
                      </span>
                    </div>

                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/6">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${skill.score}%` }}
                        transition={{
                          delay: 0.15 + index * 0.06,
                          duration: 0.8,
                        }}
                        className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-500"
                      />
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 backdrop-blur-xl sm:p-8">
            <p className="text-xs uppercase tracking-[0.25em] text-white/30">
              Challenge evidence
            </p>

            <h2 className="mt-2 text-2xl font-semibold">
              Recent proof
            </h2>

            <div className="mt-7 space-y-3">
              {attempts.length === 0 ? (
                <p className="text-sm text-white/30">
                  No completed challenges.
                </p>
              ) : (
                attempts.map((attempt, index) => {
                  const challenge = Array.isArray(attempt.challenges)
                    ? attempt.challenges[0]
                    : attempt.challenges;

                  const percentage =
                    attempt.max_score > 0
                      ? Math.round(
                          (attempt.score / attempt.max_score) * 100
                        )
                      : 0;

                  return (
                    <motion.div
                      key={attempt.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="rounded-2xl border border-white/8 bg-white/[0.025] p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium">
                          {challenge?.title ?? "Challenge"}
                        </p>

                        <span className="text-lg font-semibold text-cyan-300">
                          {percentage}%
                        </span>
                      </div>

                      <div className="mt-3 flex items-center justify-between text-xs text-white/25">
                        <span>
                          {attempt.score}/{attempt.max_score} points
                        </span>

                        <span>+{attempt.xp_earned} XP</span>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] border border-white/8 bg-white/[0.025] p-6 backdrop-blur-xl sm:p-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-violet-300/60">
                Recruiter notes
              </p>
              <h2 className="mt-2 text-2xl font-semibold">
                Private hiring notes
              </h2>
              <p className="mt-2 text-sm text-white/35">
                Keep internal context about this candidate for your hiring team.
              </p>
            </div>
            <span className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1 text-xs text-white/30">
              {recruiterNotes.length} {recruiterNotes.length === 1 ? "note" : "notes"}
            </span>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <textarea
              value={newNote}
              onChange={(event) => setNewNote(event.target.value)}
              placeholder="e.g. Strong AI evaluation skills. Move to interview."
              rows={3}
              className="min-h-[96px] flex-1 resize-none rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-violet-400/30"
            />

            <button
              type="button"
              onClick={addRecruiterNote}
              disabled={!newNote.trim() || savingNote}
              className="h-fit rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-30"
            >
              {savingNote ? "Saving..." : "Add note"}
            </button>
          </div>

          {recruiterNotes.length > 0 && (
            <div className="mt-6 space-y-3">
              {recruiterNotes.map((note) => (
                <div
                  key={note.id}
                  className="rounded-2xl border border-white/8 bg-white/[0.02] p-4"
                >
                  <p className="text-sm leading-6 text-white/70">
                    {note.note}
                  </p>
                  <p className="mt-2 text-[11px] text-white/20">
                    {new Date(note.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.025] p-7 sm:p-8">
          <p className="text-xs uppercase tracking-[0.25em] text-violet-300/70">
            Direct message
          </p>
          <h2 className="mt-3 text-2xl font-semibold">
            Message candidate
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/40">
            Contact this candidate directly about the opportunity, interview,
            or next steps.
          </p>

          <div className="mt-6 flex flex-col gap-3">
            <textarea
              value={messageText}
              onChange={(event) => {
                setMessageText(event.target.value);
                setMessageSent(false);
              }}
              rows={4}
              placeholder="e.g. Hi Nishant, we'd like to discuss the next step..."
              className="w-full resize-none rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-violet-400/40"
            />

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={sendCandidateMessage}
                disabled={!messageText.trim() || sendingMessage}
                className="rounded-xl bg-violet-400 px-5 py-3 text-sm font-semibold text-black transition hover:bg-violet-300 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {sendingMessage ? "Sending..." : "Send message"}
              </button>

              {messageSent && (
                <span className="text-sm text-emerald-300">
                  Message sent successfully.
                </span>
              )}
            </div>
          </div>

          {candidateMessages.length > 0 && (
            <div className="mt-8 border-t border-white/8 pt-6">
              <p className="text-xs uppercase tracking-[0.2em] text-white/30">
                Conversation
              </p>

              <div className="mt-4 space-y-3">
                {candidateMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`rounded-2xl border p-4 ${
                      message.sender_id === candidateId
                        ? "border-white/8 bg-white/[0.025]"
                        : "border-violet-400/15 bg-violet-400/[0.05]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-medium text-white/50">
                        {message.sender_id === candidateId
                          ? "Candidate"
                          : "You"}
                      </span>
                      <span className="text-[11px] text-white/20">
                        {new Date(message.created_at).toLocaleString()}
                      </span>
                    </div>

                    <p className="mt-2 text-sm leading-6 text-white/70">
                      {message.message}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="mt-8 rounded-[2rem] border border-cyan-400/15 bg-gradient-to-br from-cyan-400/[0.07] to-violet-500/[0.05] p-7 sm:p-8">
          <p className="text-xs uppercase tracking-[0.25em] text-cyan-300/60">
            Recruit with evidence
          </p>

          <h2 className="mt-3 text-2xl font-semibold">
            This candidate is more than a resume.
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/40">
            Use verified skills and challenge performance as an
            additional signal before moving a candidate into interviews.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            {application && application.status !== "rejected" && (
              <>
                {application.status === "applied" && (
                  <button
                    onClick={async () => {
                      const { error } = await supabase.rpc(
                        "update_application_status",
                        {
                          p_application_id: application.id,
                          p_status: "shortlisted",
                        }
                      );

                      if (!error) {
                        setApplication({
                          ...application,
                          status: "shortlisted",
                        });
                      }
                    }}
                    className="rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-black transition hover:bg-cyan-300"
                  >
                    Shortlist candidate
                  </button>
                )}

                {application.status === "shortlisted" && (
                  <button
                    onClick={async () => {
                      const { error } = await supabase.rpc(
                        "update_application_status",
                        {
                          p_application_id: application.id,
                          p_status: "interview",
                        }
                      );

                      if (!error) {
                        setApplication({
                          ...application,
                          status: "interview",
                        });
                      }
                    }}
                    className="rounded-xl bg-violet-400 px-5 py-3 text-sm font-semibold text-black transition hover:bg-violet-300"
                  >
                    Move to interview
                  </button>
                )}

                {application.status === "interview" && (
                  <button
                    onClick={async () => {
                      const { error } = await supabase.rpc(
                        "update_application_status",
                        {
                          p_application_id: application.id,
                          p_status: "hired",
                        }
                      );

                      if (!error) {
                        setApplication({
                          ...application,
                          status: "hired",
                        });
                      }
                    }}
                    className="rounded-xl bg-green-400 px-5 py-3 text-sm font-semibold text-black transition hover:bg-green-300"
                  >
                    Hire candidate
                  </button>
                )}

                <button
                  onClick={async () => {
                    const { error } = await supabase.rpc(
                      "update_application_status",
                      {
                        p_application_id: application.id,
                        p_status: "rejected",
                      }
                    );

                    if (!error) {
                      setApplication({
                        ...application,
                        status: "rejected",
                      });
                    }
                  }}
                  className="rounded-xl border border-red-400/15 bg-red-400/[0.06] px-5 py-3 text-sm text-red-300 transition hover:border-red-400/30 hover:bg-red-400/10"
                >
                  Reject
                </button>
              </>
            )}

            {application && (
              <span className="rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm capitalize text-white/45">
                Status: {application.status}
              </span>
            )}

            <Link
              href="/company"
              className="rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm text-white/60 transition hover:bg-white/[0.08] hover:text-white"
            >
              Back to candidates
            </Link>
          </div>
        </section>

        <footer className="border-t border-white/8 py-8 text-center text-xs text-white/20">
          PROOF — Don&apos;t just apply. Prove yourself.
        </footer>
      </div>
    </main>
  );
}
