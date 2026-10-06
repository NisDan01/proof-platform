"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { calculateMatchScore, getMatchLabel } from "@/lib/matching";

type Opportunity = {
  id: string;
  title: string;
  company_name: string;
  description: string | null;
  opportunity_type: string;
  location: string | null;
  remote: boolean;
  salary_min: number | null;
  salary_max: number | null;
  currency: string;
};

type Skill = {
  id: string;
  name: string;
  required_score: number;
};

type HiringChallenge = {
  id: string;
  title: string;
  description: string | null;
  duration_minutes: number;
  passing_score: number;
  required_status: string;
};

export default function OpportunityDetailPage() {
  const supabase = createClient();
  const params = useParams();
  const opportunityId = params.id as string;

  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [candidateSkills, setCandidateSkills] = useState<
    { skill_id: string; score: number; verified: boolean }[]
  >([]);
  const [matchScore, setMatchScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null);
  const [hiringChallenge, setHiringChallenge] = useState<HiringChallenge | null>(null);
  const [applicationError, setApplicationError] = useState("");

  useEffect(() => {
    async function loadOpportunity() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/auth";
        return;
      }

      const { data, error } = await supabase
        .from("opportunities")
        .select(
          "id, title, company_name, description, opportunity_type, location, remote, salary_min, salary_max, currency"
        )
        .eq("id", opportunityId)
        .eq("status", "open")
        .single();

      if (error) {
        console.error("PROOF opportunity error:", error);
        setLoading(false);
        return;
      }

      setOpportunity(data);

      const { data: existingApplication } = await supabase
        .from("applications")
        .select("id, status")
        .eq("opportunity_id", opportunityId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingApplication) {
        setApplied(true);
        setApplicationStatus(existingApplication.status);
      }

      const { data: challengeData } = await supabase
        .from("hiring_challenges")
        .select(
          "id, title, description, duration_minutes, passing_score, required_status"
        )
        .eq("opportunity_id", opportunityId)
        .eq("published", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (challengeData) {
        setHiringChallenge(challengeData);
      }

      const { data: skillRows, error: skillError } = await supabase
        .from("opportunity_skills")
        .select("skill_id, required_score")
        .eq("opportunity_id", opportunityId);

      if (skillError) {
        console.error("PROOF opportunity skills error:", skillError);
      }

      const skillIds = (skillRows ?? []).map((item) => item.skill_id);

      if (skillIds.length > 0) {
        const { data: skillData } = await supabase
          .from("skills")
          .select("id, name")
          .in("id", skillIds);

        const skillMap = new Map(
          (skillData ?? []).map((skill) => [skill.id, skill.name])
        );

        const formattedRequiredSkills = (skillRows ?? []).map((item) => ({
          id: item.skill_id,
          name: skillMap.get(item.skill_id) ?? "Skill",
          required_score: item.required_score ?? 0,
        }));

        setSkills(formattedRequiredSkills);

        const { data: userSkillRows } = await supabase
          .from("user_skills")
          .select("skill_id, score, verified")
          .eq("user_id", user.id)
          .in("skill_id", skillIds);

        const formattedCandidateSkills = (userSkillRows ?? []).map(
          (item) => ({
            skill_id: item.skill_id,
            score: item.score ?? 0,
            verified: item.verified ?? false,
          })
        );

        setCandidateSkills(formattedCandidateSkills);

        const score = calculateMatchScore(
          formattedCandidateSkills,
          formattedRequiredSkills.map((skill) => ({
            skill_id: skill.id,
            required_score: skill.required_score,
          }))
        );

        setMatchScore(score);
      }

      setLoading(false);
    }

    loadOpportunity();
  }, [opportunityId]);

  async function handleApply() {
    setApplying(true);
    setApplicationError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/auth";
      return;
    }

    const { error } = await supabase.from("applications").insert({
      opportunity_id: opportunityId,
      user_id: user.id,
      status: "applied",
    });

    if (error) {
      if (error.code === "23505") {
        setApplied(true);
      } else {
        console.error("PROOF application error:", error);
        setApplicationError("Something went wrong. Please try again.");
      }

      setApplying(false);
      return;
    }

    setApplied(true);
    setApplicationStatus("applied");
    setApplying(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#050507] text-white">
        <div className="mx-auto max-w-5xl px-6 py-20 text-white/40">
          Loading opportunity...
        </div>
      </main>
    );
  }

  if (!opportunity) {
    return (
      <main className="min-h-screen bg-[#050507] text-white">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <h1 className="text-3xl font-semibold">
            Opportunity not found
          </h1>

          <Link
            href="/opportunities"
            className="mt-6 inline-block text-cyan-400"
          >
            ← Back to opportunities
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050507] text-white">
      <div className="mx-auto max-w-5xl px-6 py-10">

        <header className="mb-14 flex items-center justify-between">
          <Link
            href="/"
            className="text-xl font-semibold tracking-tight"
          >
            PROOF<span className="text-cyan-400">.</span>
          </Link>

          <Link
            href="/opportunities"
            className="rounded-full border border-white/10 px-5 py-2.5 text-sm text-white/70 transition hover:bg-white/[0.05]"
          >
            All Opportunities
          </Link>
        </header>

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 md:p-12">

          <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">

            <div>
              <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs text-cyan-300">
                {opportunity.opportunity_type}
              </span>

              <h1 className="mt-6 text-4xl font-semibold tracking-tight md:text-5xl">
                {opportunity.title}
              </h1>

              <p className="mt-3 text-lg text-white/50">
                {opportunity.company_name}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-5 md:min-w-[220px]">
              <p className="text-xs uppercase tracking-wider text-white/30">
                Compensation
              </p>

              <p className="mt-2 text-xl font-semibold">
                {opportunity.salary_min && opportunity.salary_max
                  ? `₹${opportunity.salary_min.toLocaleString(
                      "en-IN"
                    )} – ₹${opportunity.salary_max.toLocaleString(
                      "en-IN"
                    )}`
                  : "Not specified"}
              </p>
            </div>

          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            {opportunity.remote && (
              <span className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/60">
                Remote
              </span>
            )}

            {opportunity.location && opportunity.location !== "Remote" && (
              <span className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/60">
                {opportunity.location}
              </span>
            )}
          </div>

          <div className="mt-12 grid gap-10 md:grid-cols-[1fr_300px]">

            <div>
              <h2 className="text-xl font-semibold">
                About the opportunity
              </h2>

              <p className="mt-5 whitespace-pre-line text-base leading-8 text-white/55">
                {opportunity.description}
              </p>

              {skills.length > 0 && (
                <div className="mt-10">
                  <h2 className="text-xl font-semibold">
                    Skills required
                  </h2>

                  <div className="mt-5 flex flex-wrap gap-3">
                    {skills.map((skill) => (
                      <span
                        key={skill.id}
                        className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/60"
                      >
                        {skill.name}
                        {skill.required_score > 0 &&
                          ` · ${skill.required_score}+`}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <aside className="h-fit space-y-4">
              <div className="rounded-3xl border border-cyan-400/15 bg-cyan-400/[0.05] p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/60">
                      PROOF Match
                    </p>
                    <h3 className="mt-2 text-lg font-semibold">
                      Your match
                    </h3>
                  </div>

                  <div className="text-right">
                    <p className="text-3xl font-semibold text-cyan-300">
                      {matchScore}%
                    </p>
                    <p className="mt-1 text-xs text-white/30">
                      {getMatchLabel(matchScore)}
                    </p>
                  </div>
                </div>

                <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 transition-all duration-700"
                    style={{ width: `${matchScore}%` }}
                  />
                </div>

                <div className="mt-5 space-y-3">
                  {skills.map((skill) => {
                    const candidateSkill = candidateSkills.find(
                      (item) => item.skill_id === skill.id
                    );

                    const score = candidateSkill?.score ?? 0;
                    const meetsRequirement =
                      score >= skill.required_score;

                    return (
                      <div key={skill.id}>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs text-white/55">
                            {skill.name}
                          </span>

                          <span
                            className={`text-xs font-medium ${
                              meetsRequirement
                                ? "text-cyan-300"
                                : "text-amber-300"
                            }`}
                          >
                            {score}/{skill.required_score}
                          </span>
                        </div>

                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/8">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${
                              meetsRequirement
                                ? "bg-cyan-400"
                                : "bg-amber-400"
                            }`}
                            style={{
                              width: `${Math.min(score, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <p className="text-sm text-white/40">
                Your PROOF profile
              </p>

              <h3 className="mt-2 text-lg font-semibold">
                Ready to prove your skills?
              </h3>

              <p className="mt-3 text-sm leading-6 text-white/40">
                Your verified skills and challenge results can become
                part of your application.
              </p>

              <button
                type="button"
                onClick={handleApply}
                disabled={applying || applied}
                className={`mt-6 w-full rounded-2xl px-5 py-3 font-medium transition ${
                  applied
                    ? "cursor-default border border-cyan-400/30 bg-cyan-400/10 text-cyan-300"
                    : "bg-white text-black hover:bg-white/90"
                }`}
              >
                {applying
                  ? "Applying..."
                  : applied
                  ? "Applied ✓"
                  : "Apply with PROOF"}
              </button>

              {applicationError && (
                <p className="mt-3 text-center text-xs text-red-400">
                  {applicationError}
                </p>
              )}
              </div>

              {hiringChallenge && applicationStatus && (
                <div className="rounded-3xl border border-violet-400/15 bg-gradient-to-br from-violet-500/[0.08] to-cyan-400/[0.05] p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-violet-300/60">
                        Hiring challenge
                      </p>

                      <h3 className="mt-2 text-lg font-semibold">
                        {hiringChallenge.title}
                      </h3>
                    </div>

                    <span className="rounded-full border border-violet-400/20 bg-violet-400/10 px-2.5 py-1 text-[10px] font-semibold text-violet-300">
                      {hiringChallenge.duration_minutes} MIN
                    </span>
                  </div>

                  <p className="mt-4 text-sm leading-6 text-white/40">
                    {hiringChallenge.description ||
                      "Complete this practical challenge to prove your skills."}
                  </p>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-white/8 bg-black/20 p-3">
                      <p className="text-[10px] uppercase tracking-wider text-white/25">
                        Passing score
                      </p>
                      <p className="mt-1 text-sm font-medium text-white/70">
                        {hiringChallenge.passing_score}%
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/8 bg-black/20 p-3">
                      <p className="text-[10px] uppercase tracking-wider text-white/25">
                        Your status
                      </p>
                      <p className="mt-1 text-sm font-medium capitalize text-white/70">
                        {applicationStatus}
                      </p>
                    </div>
                  </div>

                  <Link
                    href={`/hiring-challenges/${hiringChallenge.id}`}
                    className="mt-5 block w-full rounded-2xl bg-white px-5 py-3 text-center text-sm font-semibold text-black transition hover:bg-cyan-300"
                  >
                    Start hiring challenge →
                  </Link>
                </div>
              )}
            </aside>

          </div>
        </section>

      </div>
    </main>
  );
}
