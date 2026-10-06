"use client";

import { motion } from "framer-motion";
import { calculateMatchScore, getMatchLabel } from "@/lib/matching";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Company = {
  id: string;
  name: string;
  description: string | null;
  website: string | null;
  verified: boolean;
};

type Opportunity = {
  id: string;
  title: string;
  company_name: string;
  opportunity_type: string;
  status: string;
  created_at: string;
};

type HiringChallenge = {
  id: string;
  title: string;
  description: string | null;
  duration_minutes: number;
  passing_score: number;
  published: boolean;
  required_status: string;
  opportunity_id: string;
};

type Application = {
  id: string;
  status: string;
  created_at: string;
  opportunity_id: string;
  user_id: string;
  opportunities:
    | {
        title: string;
        company_name: string;
      }
    | {
        title: string;
        company_name: string;
      }[]
    | null;
};

const statusStyles: Record<string, string> = {
  applied: "border-blue-400/20 bg-blue-400/10 text-blue-300",
  reviewing: "border-yellow-400/20 bg-yellow-400/10 text-yellow-300",
  shortlisted: "border-cyan-400/20 bg-cyan-400/10 text-cyan-300",
  interview: "border-violet-400/20 bg-violet-400/10 text-violet-300",
  hired: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
  rejected: "border-red-400/20 bg-red-400/10 text-red-300",
};

export default function CompanyDashboard() {
  const supabase = createClient();

  const [company, setCompany] = useState<Company | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [hiringChallenges, setHiringChallenges] = useState<HiringChallenge[]>([]);
  const [candidateMatches, setCandidateMatches] = useState<
    { userId: string; name: string; score: number; label: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/auth";
        return;
      }

      const { data: companyData } = await supabase
        .from("companies")
        .select("id, name, description, website, verified")
        .eq("owner_id", user.id)
        .limit(1)
        .maybeSingle();

      if (!companyData) {
        setLoading(false);
        return;
      }

      setCompany(companyData);

      const { data: opportunityData } = await supabase
        .from("opportunities")
        .select(
          "id, title, company_name, opportunity_type, status, created_at"
        )
        .eq("company_id", companyData.id)
        .order("created_at", { ascending: false });

      const loadedOpportunities = opportunityData ?? [];
      setOpportunities(loadedOpportunities);

      const ids = loadedOpportunities.map((item) => item.id);

      if (ids.length > 0) {
        const { data: challengeData } = await supabase
          .from("hiring_challenges")
          .select(
            "id, title, description, duration_minutes, passing_score, published, required_status, opportunity_id"
          )
          .in("opportunity_id", ids)
          .order("created_at", { ascending: false });

        setHiringChallenges(challengeData ?? []);
      } else {
        setHiringChallenges([]);
      }

      if (ids.length > 0) {
        const { data: applicationData } = await supabase
          .from("applications")
          .select(
            `
              id,
              status,
              created_at,
              opportunity_id,
              user_id,
              opportunities (
                title,
                company_name
              )
            `
          )
          .in("opportunity_id", ids)
          .order("created_at", { ascending: false });

        setApplications(
          (applicationData ?? []) as unknown as Application[]
        );

        const applicantIds = [...new Set((applicationData ?? []).map((item: any) => item.user_id))];

        if (applicantIds.length > 0) {
          const { data: applicantProfiles } = await supabase
            .from("profiles")
            .select("id, full_name, username")
            .in("id", applicantIds);

          const profileMap = new Map(
            (applicantProfiles ?? []).map((profile) => [
              profile.id,
              profile.full_name || profile.username || "PROOF Candidate",
            ])
          );

          const { data: applicantSkills } = await supabase.from("user_skills").select("user_id, skill_id, score, verified").in("user_id", applicantIds);
          const opportunityIds = [...new Set((applicationData ?? []).map((item: any) => item.opportunity_id))];
          const { data: requiredSkills } = await supabase.from("opportunity_skills").select("opportunity_id, skill_id, required_score").in("opportunity_id", opportunityIds);
          const matches = applicantIds.map((userId) => {
            const application = (applicationData ?? []).find((item: any) => item.user_id === userId);
            const candidateSkills = (applicantSkills ?? []).filter((skill: any) => skill.user_id === userId).map((skill: any) => ({ skill_id: skill.skill_id, score: skill.score ?? 0, verified: skill.verified ?? false }));
            const required = (requiredSkills ?? []).filter((skill: any) => skill.opportunity_id === application?.opportunity_id).map((skill: any) => ({ skill_id: skill.skill_id, required_score: skill.required_score ?? 0 }));
            const score = calculateMatchScore(candidateSkills, required);
            return {
              userId,
              name: profileMap.get(userId) ?? `Candidate #${userId.slice(0, 8)}`,
              score,
              label: getMatchLabel(score),
            };
          });
          setCandidateMatches(matches.sort((a, b) => b.score - a.score));
        }
      }

      setLoading(false);
    }

    loadDashboard();
  }, []);

  async function updateStatus(
    applicationId: string,
    status: string
  ) {
    setUpdating(applicationId);

    const { error } = await supabase.rpc(
      "update_application_status",
      {
        p_application_id: applicationId,
        p_status: status,
      }
    );

    if (!error) {
      setApplications((current) =>
        current.map((application) =>
          application.id === applicationId
            ? { ...application, status }
            : application
        )
      );
    } else {
      console.error("PROOF status update error:", error);
      alert("Could not update application status.");
    }

    setUpdating(null);
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#030407] text-white">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-cyan-400" />
      </main>
    );
  }

  if (!company) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#030407] px-6 text-white">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-400">
            PROOF Companies
          </p>
          <h1 className="mt-4 text-3xl font-semibold">
            Create your company profile
          </h1>
          <p className="mt-3 text-white/40">
            Set up your company before posting opportunities.
          </p>
        </div>
      </main>
    );
  }

  const reviewing = applications.filter(
    (item) =>
      item.status === "reviewing" ||
      item.status === "applied"
  ).length;

  const shortlisted = applications.filter(
    (item) => item.status === "shortlisted"
  ).length;

  const interviews = applications.filter(
    (item) => item.status === "interview"
  ).length;

  const hired = applications.filter(
    (item) => item.status === "hired"
  ).length;

  const openJobs = opportunities.filter(
    (item) => item.status === "open"
  ).length;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#030407] text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <motion.div
          animate={{
            x: [0, 100, -40, 0],
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
            x: [0, -80, 40, 0],
            y: [0, 50, -30, 0],
            scale: [1, 0.9, 1.1, 1],
          }}
          transition={{
            duration: 19,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute right-[0%] top-[35%] h-[28rem] w-[28rem] rounded-full bg-violet-500/10 blur-[130px]"
        />

        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:70px_70px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-5 py-7 sm:px-8">
        <header className="flex items-center justify-between border-b border-white/8 pb-6">
          <Link
            href="/"
            className="text-2xl font-bold tracking-tight"
          >
            PROOF<span className="text-cyan-400">.</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/opportunities"
              className="hidden rounded-full px-4 py-2 text-sm text-white/50 transition hover:text-white sm:block"
            >
              Marketplace
            </Link>

            <div className="flex items-center gap-3">
              <Link
                href="/company/challenges/new"
                className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-5 py-2.5 text-sm font-semibold text-cyan-300 transition hover:border-cyan-400/40 hover:bg-cyan-400/15"
              >
                + Hiring challenge
              </Link>

              <Link
                href="/company/opportunities/new"
                className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-cyan-300"
              >
                + Post opportunity
              </Link>
            </div>
          </div>
        </header>

        <section className="py-12">
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div>
              <div className="flex items-center gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-400">
                  Company workspace
                </p>

                {company.verified && (
                  <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-[10px] font-semibold text-cyan-300">
                    ✓ VERIFIED
                  </span>
                )}
              </div>

              <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
                {company.name}
              </h1>

              <p className="mt-4 max-w-2xl leading-7 text-white/40">
                Find people who can actually prove they can do the work.
              </p>
            </div>

            <Link
              href="/company/opportunities/new"
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-4 text-sm font-medium text-white/70 backdrop-blur transition hover:border-cyan-400/30 hover:bg-white/[0.07] hover:text-white"
            >
              Create a new opportunity →
            </Link>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            ["Open opportunities", openJobs, "Live roles"],
            ["Applications", applications.length, "Total candidates"],
            ["Review queue", reviewing, "Need attention"],
            ["Shortlisted", shortlisted, "Strong matches"],
            ["Hired", hired, "Successful hires"],
          ].map(([label, value, sub], index) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
              className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 backdrop-blur-xl"
            >
              <p className="text-xs text-white/35">{label}</p>
              <p className="mt-3 text-3xl font-semibold">{value}</p>
              <p className="mt-1 text-xs text-white/25">{sub}</p>
            </motion.div>
          ))}
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 backdrop-blur-xl sm:p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-white/30">
                  Candidate pipeline
                </p>
                <h2 className="mt-2 text-2xl font-semibold">
                  Recent applications
                </h2>
              </div>

              <span className="rounded-full bg-white/[0.05] px-3 py-1 text-xs text-white/40">
                {applications.length} total
              </span>
            </div>

            <div className="mt-7 space-y-3">
              {applications.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center">
                  <p className="text-white/50">
                    No applications yet.
                  </p>
                  <p className="mt-2 text-sm text-white/25">
                    Post an opportunity to start building your pipeline.
                  </p>
                </div>
              ) : (
                applications.slice(0, 8).map((application, index) => {
                  const opportunity =
                    Array.isArray(application.opportunities)
                      ? application.opportunities[0]
                      : application.opportunities;

                  return (
                    <motion.div
                      key={application.id}
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.04 }}
                      className="group flex flex-col gap-4 rounded-2xl border border-white/8 bg-white/[0.025] p-4 transition hover:border-white/15 hover:bg-white/[0.05] sm:flex-row sm:items-center"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400/20 to-violet-500/20 text-sm font-semibold text-cyan-300">
                        {application.user_id.slice(0, 2).toUpperCase()}
                      </div>

                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/company/candidates/${application.user_id}`}
                          className="truncate font-medium transition hover:text-cyan-300"
                        >
                          Candidate #{application.user_id.slice(0, 8)}
                        </Link>

                        <p className="mt-1 truncate text-xs text-white/35">
                          {opportunity?.title ?? "Opportunity"}
                        </p>
                      </div>

                      <div className="relative">
                        <select
                          value={application.status}
                          disabled={updating === application.id}
                          onChange={(event) =>
                            updateStatus(
                              application.id,
                              event.target.value
                            )
                          }
                          className={`appearance-none rounded-full border bg-[#080a10] py-2 pl-3 pr-8 text-xs font-medium outline-none transition hover:border-cyan-400/30 disabled:opacity-50 ${statusStyles[application.status] ?? "border-white/10 text-white/50"}`}
                        >
                          <option value="applied">Applied</option>
                          <option value="reviewing">Reviewing</option>
                          <option value="shortlisted">Shortlisted</option>
                          <option value="interview">Interview</option>
                          <option value="hired">Hired</option>
                          <option value="rejected">Rejected</option>
                        </select>

                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-white/30">
                          ▾
                        </span>

                        {updating === application.id && (
                          <span className="pointer-events-none absolute inset-y-0 right-8 flex items-center">
                            <span className="h-3 w-3 animate-spin rounded-full border border-white/20 border-t-cyan-400" />
                          </span>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.25em] text-white/30">
                Hiring funnel
              </p>

              <div className="mt-6 space-y-4">
                {[
                  ["Applications", applications.length],
                  ["Reviewing", reviewing],
                  ["Shortlisted", shortlisted],
                  ["Interviews", interviews],
                  ["Hired", hired],
                ].map(([label, value], index) => {
                  const max = Math.max(applications.length, 1);
                  const width =
                    typeof value === "number"
                      ? Math.max((value / max) * 100, value > 0 ? 8 : 0)
                      : 0;

                  return (
                    <div key={label}>
                      <div className="mb-2 flex justify-between text-xs">
                        <span className="text-white/40">{label}</span>
                        <span className="text-white/70">{value}</span>
                      </div>

                      <div className="h-1.5 overflow-hidden rounded-full bg-white/6">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${width}%` }}
                          transition={{
                            delay: index * 0.08,
                            duration: 0.7,
                          }}
                          className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-500"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[2rem] border border-cyan-400/15 bg-gradient-to-br from-cyan-400/[0.08] to-violet-500/[0.05] p-6">
              <p className="text-xs uppercase tracking-[0.25em] text-cyan-300/60">
                PROOF advantage
              </p>

              <h3 className="mt-3 text-xl font-semibold">
                Hire from evidence, not resumes.
              </h3>

              <p className="mt-3 text-sm leading-6 text-white/40">
                Candidates build verified skills through practical
                challenges before they enter your hiring pipeline.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-cyan-300/60">
                Hiring challenges
              </p>
              <h2 className="mt-2 text-2xl font-semibold">
                Practical screening
              </h2>
              <p className="mt-2 text-sm text-white/35">
                Give shortlisted candidates a real task before the interview.
              </p>
            </div>

            <Link
              href="/company/challenges/new"
              className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-medium text-white/60 transition hover:border-cyan-400/30 hover:text-white"
            >
              + New challenge
            </Link>
          </div>

          {hiringChallenges.length === 0 ? (
            <div className="mt-5 rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center">
              <p className="text-white/50">No hiring challenges yet.</p>
              <p className="mt-2 text-sm text-white/25">
                Create a practical challenge for candidates in your pipeline.
              </p>
            </div>
          ) : (
            <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {hiringChallenges.map((challenge, index) => {
                const opportunity = opportunities.find(
                  (item) => item.id === challenge.opportunity_id
                );

                return (
                  <motion.div
                    key={challenge.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.06 }}
                    whileHover={{ y: -4 }}
                    className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 backdrop-blur-xl"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span
                        className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-wider ${
                          challenge.published
                            ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                            : "border-yellow-400/20 bg-yellow-400/10 text-yellow-300"
                        }`}
                      >
                        {challenge.published ? "Published" : "Draft"}
                      </span>

                      <span className="text-xs text-white/30">
                        {challenge.duration_minutes} min
                      </span>
                    </div>

                    <h3 className="mt-5 text-lg font-semibold">
                      {challenge.title}
                    </h3>

                    <p className="mt-2 text-xs text-cyan-300/60">
                      {opportunity?.title ?? "Opportunity"}
                    </p>

                    <p className="mt-4 line-clamp-2 text-sm leading-6 text-white/35">
                      {challenge.description || "Practical hiring assessment."}
                    </p>

                    <div className="mt-5 flex items-center justify-between border-t border-white/8 pt-4">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-white/25">
                          Passing score
                        </p>
                        <p className="mt-1 text-sm font-medium text-white/70">
                          {challenge.passing_score}%
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-white/25">
                          Required status
                        </p>
                        <p className="mt-1 text-sm font-medium capitalize text-white/70">
                          {challenge.required_status}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={async () => {
                        const nextPublished = !challenge.published;

                        setHiringChallenges((current) =>
                          current.map((item) =>
                            item.id === challenge.id
                              ? { ...item, published: nextPublished }
                              : item
                          )
                        );

                        const { error } = await supabase
                          .from("hiring_challenges")
                          .update({
                            published: nextPublished,
                            updated_at: new Date().toISOString(),
                          })
                          .eq("id", challenge.id);

                        if (error) {
                          setHiringChallenges((current) =>
                            current.map((item) =>
                              item.id === challenge.id
                                ? { ...item, published: challenge.published }
                                : item
                            )
                          );
                        }
                      }}
                      className={`mt-5 w-full rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                        challenge.published
                          ? "border-red-400/15 bg-red-400/5 text-red-300 hover:bg-red-400/10"
                          : "border-cyan-400/20 bg-cyan-400/10 text-cyan-300 hover:bg-cyan-400/15"
                      }`}
                    >
                      {challenge.published ? "Unpublish challenge" : "Publish challenge"}
                    </button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>

        <section className="mt-10">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-white/30">
                Your opportunities
              </p>
              <h2 className="mt-2 text-2xl font-semibold">
                Active hiring
              </h2>
            </div>

            <span className="text-sm text-white/30">
              {opportunities.length} posted
            </span>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {opportunities.map((opportunity, index) => (
              <motion.div
                key={opportunity.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06 }}
                whileHover={{ y: -4 }}
                className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 backdrop-blur-xl"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs text-cyan-300">
                    {opportunity.opportunity_type}
                  </span>

                  <span className="text-xs text-white/25">
                    {opportunity.status}
                  </span>
                </div>

                <h3 className="mt-5 text-lg font-semibold">
                  {opportunity.title}
                </h3>

                <p className="mt-2 text-sm text-white/35">
                  {opportunity.company_name}
                </p>

                <div className="mt-6 flex items-center justify-between border-t border-white/8 pt-4">
                  <span className="text-xs text-white/25">
                    {new Date(
                      opportunity.created_at
                    ).toLocaleDateString("en-IN")}
                  </span>

                  <Link
                    href={`/opportunities/${opportunity.id}`}
                    className="text-xs font-medium text-cyan-300 transition hover:text-white"
                  >
                    View →
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-cyan-300/60">
              PROOF Intelligence
            </p>
            <h2 className="mt-2 text-2xl font-semibold">
              Top Candidate Matches
            </h2>
            <p className="mt-2 text-sm text-white/35">
              Candidates ranked by skill compatibility and verified evidence.
            </p>
          </div>

          {candidateMatches.length > 0 ? (
            <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {candidateMatches.slice(0, 6).map((candidate, index) => (
                <Link
                  key={candidate.userId}
                  href={`/company/candidates/${candidate.userId}`}
                  className="group rounded-3xl border border-white/10 bg-white/[0.035] p-5 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-cyan-400/30 hover:bg-white/[0.06]"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/30">
                      #{index + 1} MATCH
                    </span>

                    <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-300">
                      {candidate.score}%
                    </span>
                  </div>

                  <div className="mt-5 flex items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400/20 to-violet-500/20 text-xs font-bold">
                      {candidate.userId.slice(0, 2).toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {candidate.name}
                      </p>
                      <p className="mt-1 text-xs text-white/35">
                        {candidate.label}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/8">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: candidate.score + "%" }}
                      transition={{ duration: 0.8, delay: index * 0.08 }}
                      className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-500"
                    />
                  </div>

                  <div className="mt-4 flex justify-between text-xs">
                    <span className="text-white/25">
                      Skill compatibility
                    </span>
                    <span className="text-white/50 transition group-hover:text-cyan-300">
                      View proof →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center">
              <p className="text-sm text-white/35">
                Candidate matches will appear here when applications arrive.
              </p>
            </div>
          )}
        </section>

        <footer className="mt-16 border-t border-white/8 py-8 text-center text-xs text-white/20">
          PROOF — Hiring based on demonstrated ability.
        </footer>
      </div>
    </main>
  );
}
