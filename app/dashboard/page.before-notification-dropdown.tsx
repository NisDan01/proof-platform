"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

type Skill = {
  id: string;
  name: string;
  score: number;
  verified: boolean;
};

export default function DashboardPage() {
  const supabase = createClient();

  const [name, setName] = useState("Candidate");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("candidate");
  const [skills, setSkills] = useState<Skill[]>([]);
  const [challengeCount, setChallengeCount] = useState(0);
  const [applicationCount, setApplicationCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/auth";
        return;
      }

      setEmail(user.email ?? "");

      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name, username, avatar_url, role")
        .eq("id", user.id)
        .single();

      if (profileData) {
        setName(profileData.full_name || profileData.username || "Candidate");
        setRole(profileData.role || "candidate");
      }

      const { data: userSkillsData, error: skillsError } = await supabase
        .from("user_skills")
        .select("skill_id, score, verified")
        .eq("user_id", user.id);

      if (skillsError) {
        console.error("PROOF skills error:", skillsError);
      }

      const skillIds = userSkillsData?.map((item) => item.skill_id) ?? [];

      if (skillIds.length > 0) {
        const { data: skillsData, error: namesError } = await supabase
          .from("skills")
          .select("id, name")
          .in("id", skillIds);

        if (namesError) {
          console.error("PROOF skill names error:", namesError);
        }

        const skillMap = new Map(
          (skillsData ?? []).map((skill) => [skill.id, skill.name])
        );

        setSkills(
          (userSkillsData ?? []).map((item) => ({
            id: item.skill_id,
            name: skillMap.get(item.skill_id) ?? "Unknown Skill",
            score: item.score ?? 0,
            verified: item.verified ?? false,
          }))
        );
      } else {
        setSkills([]);
      }

      const { count, error: attemptsError } = await supabase
        .from("challenge_attempts")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "completed");

      if (attemptsError) {
        console.error("PROOF challenge count error:", attemptsError);
      } else {
        setChallengeCount(count ?? 0);
      }

      const { count: applicationsCount, error: applicationsError } =
        await supabase
          .from("applications")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id);

      if (applicationsError) {
        console.error(
          "PROOF applications count error:",
          applicationsError
        );
      } else {
        setApplicationCount(applicationsCount ?? 0);
      }

      const { count: unreadNotifications, error: notificationsError } =
        await supabase
          .from("notifications")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("read", false);

      if (notificationsError) {
        console.error(
          "PROOF notifications count error:",
          notificationsError
        );
      } else {
        setNotificationCount(unreadNotifications ?? 0);
      }

      setLoading(false);
    }

    loadDashboard();
  }, []);

  const verifiedCount = skills.filter((skill) => skill.verified).length;

  const averageScore =
    skills.length > 0
      ? Math.round(
          skills.reduce((total, skill) => total + skill.score, 0) /
            skills.length
        )
      : 0;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#030407] text-white">
      {/* Animated atmosphere */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <motion.div
          className="absolute -left-32 top-20 h-[420px] w-[420px] rounded-full bg-cyan-500/10 blur-[140px]"
          animate={{
            x: [0, 80, -20, 0],
            y: [0, 40, -30, 0],
            scale: [1, 1.12, 0.92, 1],
          }}
          transition={{
            duration: 14,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        <motion.div
          className="absolute right-[-120px] top-[35%] h-[500px] w-[500px] rounded-full bg-violet-600/10 blur-[160px]"
          animate={{
            x: [0, -70, 30, 0],
            y: [0, -40, 50, 0],
            scale: [1, 0.9, 1.12, 1],
          }}
          transition={{
            duration: 17,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:70px_70px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 py-8 lg:px-8">
        {/* HEADER */}
        <motion.header
          className="mb-12 flex items-center justify-between"
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
              href="/notifications"
              aria-label={
                notificationCount > 0
                  ? `${notificationCount} unread notifications`
                  : "Notifications"
              }
              className="group relative flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/60 transition duration-300 hover:-translate-y-1 hover:border-cyan-400/30 hover:bg-cyan-400/[0.08] hover:text-cyan-300"
            >
              <motion.span
                animate={
                  notificationCount > 0
                    ? { rotate: [0, -10, 10, -6, 6, 0] }
                    : { rotate: 0 }
                }
                transition={
                  notificationCount > 0
                    ? { duration: 1.2, repeat: Infinity, repeatDelay: 3 }
                    : { duration: 0.2 }
                }
                className="text-lg"
              >
                ♧
              </motion.span>

              <span className="sr-only">Notifications</span>

              {notificationCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-[#030407] bg-cyan-400 px-1 text-[10px] font-bold text-black"
                >
                  {notificationCount > 9 ? "9+" : notificationCount}
                </motion.span>
              )}
            </Link>

            <Link
              href="/company"
              className="hidden rounded-full border border-cyan-400/20 bg-cyan-400/[0.08] px-5 py-2.5 text-sm text-cyan-300 transition duration-300 hover:-translate-y-1 hover:bg-cyan-400/[0.14] sm:block"
            >
              Company Workspace
            </Link>

            <Link
              href="/challenges"
              className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm text-white/80 transition duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.08]"
            >
              Challenges
            </Link>
          </div>
        </motion.header>

        {/* HERO */}
        <motion.section
          className="mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/[0.06] px-4 py-2 text-xs text-cyan-300">
                <motion.span
                  className="h-2 w-2 rounded-full bg-cyan-400"
                  animate={{
                    opacity: [0.4, 1, 0.4],
                    scale: [0.9, 1.25, 0.9],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                Your proof workspace
              </div>

              <p className="text-sm uppercase tracking-[0.25em] text-white/35">
                PROOF Dashboard
              </p>

              <h1 className="mt-3 text-5xl font-semibold tracking-[-0.04em] sm:text-6xl">
                Welcome,{" "}
                <span className="bg-gradient-to-r from-white via-cyan-200 to-violet-300 bg-clip-text text-transparent">
                  {loading ? "Candidate" : name}
                </span>
              </h1>

              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-white/40">
                <span>{email}</span>
                <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">
                  {role}
                </span>
              </div>
            </div>

            <Link
              href="/passport"
              className="group rounded-2xl border border-white/10 bg-white/[0.035] px-5 py-4 transition duration-300 hover:-translate-y-1 hover:border-cyan-400/25 hover:bg-white/[0.06]"
            >
              <p className="text-xs uppercase tracking-widest text-white/30">
                Average skill score
              </p>
              <div className="mt-2 flex items-end gap-2">
                <span className="text-3xl font-semibold text-cyan-300">
                  {averageScore}
                </span>
                <span className="pb-1 text-sm text-white/30">/100</span>
              </div>
            </Link>
          </div>
        </motion.section>

        {/* STATS */}
        <section className="mb-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            {
              label: "Skills Verified",
              value: verifiedCount,
              href: "/passport",
              accent: true,
            },
            {
              label: "Total Skills",
              value: skills.length,
              href: "/passport",
            },
            {
              label: "Challenges",
              value: challengeCount,
              href: "/challenges",
            },
            {
              label: "History",
              value: challengeCount,
              href: "/history",
            },
            {
              label: "Applications",
              value: applicationCount,
              href: "/applications",
            },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 35 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.55,
                delay: index * 0.08,
              }}
            >
              <Link
                href={stat.href}
                className="group relative block overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] p-6 transition duration-500 hover:-translate-y-2 hover:border-cyan-400/20 hover:bg-white/[0.06] hover:shadow-[0_20px_70px_rgba(34,211,238,.07)]"
              >
                <motion.div
                  className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-cyan-400/10 blur-2xl"
                  animate={{ scale: [1, 1.25, 1] }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    delay: index * 0.3,
                  }}
                />

                <p className="relative text-sm text-white/45">
                  {stat.label}
                </p>

                <p
                  className={`relative mt-4 text-4xl font-semibold ${
                    stat.accent
                      ? "bg-gradient-to-r from-cyan-300 to-violet-300 bg-clip-text text-transparent"
                      : ""
                  }`}
                >
                  {stat.value}
                </p>

                <p className="relative mt-2 text-xs text-cyan-400/70 transition group-hover:text-cyan-300">
                  Open →
                </p>
              </Link>
            </motion.div>
          ))}
        </section>

        {/* PASSPORT */}
        <motion.section
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.8 }}
        >
          <Link
            href="/passport"
            className="group mb-6 flex items-end justify-between"
          >
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-cyan-400">
                Skill Passport
              </p>

              <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                Your verified skills
              </h2>

              <p className="mt-2 text-sm text-white/35">
                Evidence that shows what you can actually do.
              </p>
            </div>

            <span className="hidden text-sm text-white/35 transition group-hover:text-cyan-300 sm:block">
              View passport →
            </span>
          </Link>

          {skills.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-white/50">
              No skills available yet.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {skills.map((skill, index) => (
                <motion.div
                  key={skill.id}
                  initial={{ opacity: 0, y: 45, scale: 0.96 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{
                    duration: 0.6,
                    delay: index * 0.1,
                  }}
                  whileHover={{
                    y: -8,
                    scale: 1.02,
                  }}
                >
                  <Link
                    href="/passport"
                    className="group relative block overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] p-6 transition duration-500 hover:border-cyan-400/25 hover:bg-white/[0.055]"
                  >
                    <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-cyan-400/[0.06] blur-3xl transition duration-500 group-hover:bg-cyan-400/[0.12]" />

                    <div className="relative flex items-start justify-between gap-3">
                      <h3 className="font-medium text-white/85">
                        {skill.name}
                      </h3>

                      {skill.verified && (
                        <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] text-emerald-300">
                          ✓ Verified
                        </span>
                      )}
                    </div>

                    <div className="relative mt-8">
                      <div className="flex items-end justify-between">
                        <span className="text-5xl font-semibold tracking-tight">
                          {skill.score}
                        </span>

                        <span className="pb-1 text-sm text-white/25">
                          /100
                        </span>
                      </div>

                      <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/[0.07]">
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400"
                          initial={{ width: 0 }}
                          whileInView={{ width: `${skill.score}%` }}
                          viewport={{ once: true }}
                          transition={{
                            duration: 1.2,
                            delay: 0.35 + index * 0.1,
                            ease: "easeOut",
                          }}
                        />
                      </div>

                      <p className="mt-4 text-xs text-white/25">
                        {skill.verified
                          ? "Verified through PROOF challenge"
                          : "Skill evidence in progress"}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>

        {/* ACTION AREA */}
        <motion.section
          className="mt-12 grid gap-4 lg:grid-cols-[1.4fr_.6fr]"
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.8 }}
        >
          <Link
            href="/challenges"
            className="group relative overflow-hidden rounded-[32px] border border-cyan-400/15 bg-gradient-to-br from-cyan-400/[0.08] via-white/[0.03] to-violet-500/[0.07] p-8 transition duration-500 hover:-translate-y-2 hover:border-cyan-400/30"
          >
            <motion.div
              className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-cyan-400/10 blur-3xl"
              animate={{
                x: [0, -25, 0],
                y: [0, 25, 0],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            <div className="relative">
              <p className="text-xs uppercase tracking-[0.25em] text-cyan-300">
                Build more proof
              </p>

              <h3 className="mt-4 max-w-xl text-3xl font-semibold tracking-tight">
                Take another challenge and make your Skill Passport stronger.
              </h3>

              <p className="mt-4 max-w-lg text-sm leading-6 text-white/40">
                Complete practical tasks, improve your scores and create
                evidence companies can trust.
              </p>

              <div className="mt-8 inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition group-hover:scale-105">
                Explore challenges →
              </div>
            </div>
          </Link>

          <Link
            href="/opportunities"
            className="group rounded-[32px] border border-white/10 bg-white/[0.035] p-8 transition duration-500 hover:-translate-y-2 hover:border-violet-400/25 hover:bg-white/[0.055]"
          >
            <p className="text-xs uppercase tracking-[0.25em] text-violet-300">
              Find opportunities
            </p>

            <h3 className="mt-4 text-2xl font-semibold">
              Let your proof open doors.
            </h3>

            <p className="mt-4 text-sm leading-6 text-white/40">
              Explore jobs, projects and internships that match your skills.
            </p>

            <span className="mt-8 inline-block text-sm text-white/50 transition group-hover:translate-x-1 group-hover:text-violet-300">
              Explore marketplace →
            </span>
          </Link>
        </motion.section>

        {/* FOOTER */}
        <footer className="mt-20 border-t border-white/8 py-8">
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
