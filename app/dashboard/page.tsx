"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Profile = {
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  role: string | null;
};

type Skill = {
  name: string;
  score: number;
  verified: boolean;
};

const navigation = [
  { name: "Overview", href: "/dashboard", icon: "⌂" },
  { name: "Challenges", href: "/challenges", icon: "◇" },
  { name: "Opportunities", href: "/opportunities", icon: "◈" },
  { name: "Skill Passport", href: "/dashboard#skills", icon: "◆" },
  { name: "Applications", href: "/applications", icon: "↗" },
  { name: "Messages", href: "/messages", icon: "◌", badge: true },
  { name: "Notifications", href: "/dashboard#notifications", icon: "♢" },
  { name: "Saved", href: "/saved", icon: "♡" },
];

const accountNavigation = [
  { name: "Profile", href: "/profile", icon: "◎" },
  { name: "Settings", href: "/settings", icon: "⚙" },
];

export default function DashboardPage() {
  const supabase = createClient();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState("");
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
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

      const { data: userSkillsData } = await supabase
        .from("user_skills")
        .select("skill_id, score, verified")
        .eq("user_id", user.id);

      const skillIds = userSkillsData?.map((item) => item.skill_id) ?? [];

      let skillNames: Record<string, string> = {};

      if (skillIds.length > 0) {
        const { data: skillsData } = await supabase
          .from("skills")
          .select("id, name")
          .in("id", skillIds);

        skillNames =
          skillsData?.reduce(
            (acc, skill) => {
              acc[skill.id] = skill.name;
              return acc;
            },
            {} as Record<string, string>
          ) ?? {};
      }

      setProfile(profileData);

      setSkills(
        userSkillsData
          ?.map((item) => ({
            name: skillNames[item.skill_id] ?? "Unknown Skill",
            score: item.score ?? 0,
            verified: item.verified ?? false,
          }))
          .sort((a, b) => b.score - a.score) ?? []
      );

      setLoading(false);
    }

    loadDashboard();
  }, [supabase]);

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050507] text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-cyan-400" />
          <p className="text-sm text-zinc-500">Loading your PROOF workspace...</p>
        </div>
      </main>
    );
  }

  const verifiedCount = skills.filter((skill) => skill.verified).length;
  const averageScore =
    skills.length > 0
      ? Math.round(
          skills.reduce((sum, skill) => sum + skill.score, 0) / skills.length
        )
      : 0;

  const profileStrength = Math.min(
    100,
    Math.round(averageScore * 0.7 + verifiedCount * 7.5)
  );

  return (
    <main style={{ backgroundImage: "none" }} className="min-h-screen bg-[#050507] text-white">
      <div className="flex min-h-screen">

        {/* SIDEBAR */}
        <aside className="hidden w-[250px] shrink-0 border-r border-white/[0.07] bg-[#08080c] lg:flex lg:flex-col">

          <div className="px-7 pb-8 pt-8">
            <Link href="/" className="group">
              <div className="text-2xl font-black tracking-[-0.06em]">
                PROOF<span className="text-cyan-400">.</span>
              </div>

              <div className="mt-1 flex items-center gap-2 text-[9px] font-bold tracking-[0.22em] text-zinc-500">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
                SKILL-FIRST NETWORK
              </div>
            </Link>
          </div>

          <div className="px-4">
            <p className="mb-3 px-3 text-[10px] font-bold tracking-[0.2em] text-zinc-600">
              WORKSPACE
            </p>

            <nav className="space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center justify-between rounded-xl px-3 py-3 text-sm font-medium transition-all ${
                    item.name === "Overview"
                      ? "bg-white/[0.09] text-white shadow-[inset_3px_0_0_#22d3ee]"
                      : "text-zinc-500 hover:bg-white/[0.05] hover:text-white"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span className="w-5 text-center text-base text-zinc-400 group-hover:text-cyan-400">
                      {item.icon}
                    </span>
                    {item.name}
                  </span>

                  {item.badge && (
                    <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.9)]" />
                  )}
                </Link>
              ))}
            </nav>
          </div>

          <div className="mt-8 px-4">
            <p className="mb-3 px-3 text-[10px] font-bold tracking-[0.2em] text-zinc-600">
              ACCOUNT
            </p>

            <nav className="space-y-1">
              {accountNavigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-zinc-500 transition hover:bg-white/[0.05] hover:text-white"
                >
                  <span className="w-5 text-center text-base text-zinc-400 group-hover:text-cyan-400">
                    {item.icon}
                  </span>
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>

          <div className="mt-auto p-4">
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-4">
              <div className="mb-3 flex items-center gap-3">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Profile"
                    className="h-9 w-9 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-violet-500 text-sm font-bold text-black">
                    {profile?.full_name?.charAt(0) ?? "N"}
                  </div>
                )}

                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-white">
                    {profile?.full_name ?? "Candidate"}
                  </p>
                  <p className="truncate text-[10px] text-zinc-500">
                    {profile?.role ?? "candidate"}
                  </p>
                </div>
              </div>

              <button
                onClick={signOut}
                className="w-full rounded-lg border border-white/[0.07] py-2 text-xs text-zinc-500 transition hover:border-red-400/20 hover:text-red-300"
              >
                Sign out
              </button>
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <section className="min-w-0 flex-1">

          {/* MOBILE HEADER */}
          <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4 lg:hidden">
            <Link href="/" className="text-xl font-black tracking-[-0.05em]">
              PROOF<span className="text-cyan-400">.</span>
            </Link>

            <Link
              href="/messages"
              className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2 text-xs font-medium"
            >
              Messages
            </Link>
          </div>

          <div className="mx-auto max-w-[1250px] px-5 py-7 sm:px-8 lg:px-10 lg:py-10">

            {/* TOP */}
            <div className="mb-8 flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/[0.06] px-3 py-1.5 text-[10px] font-bold tracking-[0.16em] text-cyan-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
                  CANDIDATE WORKSPACE
                </div>

                <h1 className="text-4xl font-black tracking-[-0.045em] sm:text-5xl">
                  Welcome back,{" "}
                  <span className="bg-gradient-to-r from-white via-cyan-100 to-violet-300 bg-clip-text text-transparent">
                    {profile?.full_name?.split(" ")[0] ?? "Nishant"}
                  </span>
                  <span className="text-cyan-400">.</span>
                </h1>

                <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-500">
                  Your skills are your proof. Keep building them and let
                  opportunities come to you.
                </p>
              </div>

              <div className="flex gap-3">
                <Link
                  href="/messages"
                  className="relative rounded-xl border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-semibold text-zinc-200 transition hover:border-cyan-400/30 hover:bg-cyan-400/[0.06]"
                >
                  Messages
                  <span className="ml-2 inline-block h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.9)]" />
                </Link>

                <Link
                  href="/challenges"
                  className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-black transition hover:scale-[1.02] hover:bg-cyan-100"
                >
                  Take a challenge →
                </Link>
              </div>
            </div>

            {/* STATS */}
            <div className="mb-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

              <div className="group rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.075] to-white/[0.025] p-5 transition hover:border-cyan-400/20">
                <p className="text-[10px] font-bold tracking-[0.12em] text-zinc-500">
                  VERIFIED SKILLS
                </p>

                <div className="mt-3 flex items-end gap-2">
                  <span className="text-4xl font-black">{verifiedCount}</span>
                  <span className="mb-1 text-sm text-zinc-600">
                    / {skills.length}
                  </span>
                </div>

                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-400"
                    style={{
                      width: `${
                        skills.length
                          ? (verifiedCount / skills.length) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div className="group rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.075] to-white/[0.025] p-5 transition hover:border-violet-400/20">
                <p className="text-[10px] font-bold tracking-[0.12em] text-zinc-500">
                  AVERAGE SCORE
                </p>

                <div className="mt-3 flex items-end gap-2">
                  <span className="text-4xl font-black">{averageScore}</span>
                  <span className="mb-1 text-sm text-zinc-600">/100</span>
                </div>

                <p className="mt-4 text-xs font-medium text-violet-300">
                  Skill strength
                </p>
              </div>

              <div className="group rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.075] to-white/[0.025] p-5 transition hover:border-amber-400/20">
                <p className="text-[10px] font-bold tracking-[0.12em] text-zinc-500">
                  CHALLENGES
                </p>

                <div className="mt-3 text-4xl font-black">0</div>

                <p className="mt-4 text-xs font-medium text-zinc-500">
                  Your first challenge awaits
                </p>
              </div>

              <div className="rounded-2xl border border-violet-400/20 bg-gradient-to-br from-violet-500/[0.12] to-cyan-400/[0.05] p-5 shadow-[0_0_40px_rgba(139,92,246,0.06)]">
                <p className="text-[10px] font-bold tracking-[0.12em] text-cyan-300">
                  PROFILE STRENGTH
                </p>

                <div className="mt-3 text-4xl font-black">
                  {profileStrength}%
                </div>

                <p className="mt-4 text-xs font-medium text-cyan-300">
                  Keep building proof →
                </p>
              </div>
            </div>

            {/* SKILL PASSPORT */}
            <section id="skills">
              <div className="mb-5 flex items-end justify-between">
                <div>
                  <p className="text-[10px] font-bold tracking-[0.18em] text-cyan-400">
                    YOUR PROOF
                  </p>

                  <h2 className="mt-1 text-2xl font-black tracking-tight">
                    Skill Passport
                  </h2>
                </div>

                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-zinc-400">
                  {skills.length} skills
                </span>
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                {skills.map((skill, index) => (
                  <div
                    key={skill.name}
                    className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.065] to-white/[0.02] p-5 transition duration-300 hover:-translate-y-0.5 hover:border-cyan-400/20 hover:shadow-[0_15px_50px_rgba(0,0,0,0.25)]"
                  >
                    <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-cyan-400/[0.04] blur-2xl transition group-hover:bg-cyan-400/[0.09]" />

                    <div className="relative">
                      <div className="mb-5 flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.07] text-[10px] font-bold text-cyan-300">
                            {String(index + 1).padStart(2, "0")}
                          </span>

                          <div>
                            <h3 className="font-bold">{skill.name}</h3>

                            <p
                              className={`mt-1 text-[10px] font-medium ${
                                skill.verified
                                  ? "text-cyan-400"
                                  : "text-zinc-600"
                              }`}
                            >
                              {skill.verified
                                ? "✓ Verified skill"
                                : "Not verified"}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-3xl font-black">
                            {skill.score}
                          </div>
                          <div className="text-[9px] font-bold tracking-widest text-zinc-600">
                            SCORE
                          </div>
                        </div>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-white/[0.08]">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-300 to-violet-400 shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-all duration-700"
                          style={{ width: `${skill.score}%` }}
                        />
                      </div>

                      <div className="mt-2 flex justify-between text-[9px] text-zinc-600">
                        <span>0</span>
                        <span>100</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* LOWER CTA */}
            <div className="mt-10 overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-r from-cyan-400/[0.07] via-violet-500/[0.08] to-transparent p-6 sm:p-8">
              <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                <div>
                  <p className="text-xs font-bold tracking-[0.16em] text-cyan-400">
                    BUILD YOUR PROOF
                  </p>
                  <h3 className="mt-2 text-xl font-bold">
                    Ready to prove what you can do?
                  </h3>
                  <p className="mt-1 text-sm text-zinc-500">
                    Complete practical challenges and strengthen your Skill
                    Passport.
                  </p>
                </div>

                <Link
                  href="/challenges"
                  className="shrink-0 rounded-xl bg-white px-5 py-3 text-sm font-bold text-black transition hover:scale-[1.02] hover:bg-cyan-100"
                >
                  Explore challenges →
                </Link>
              </div>
            </div>

            <p className="mt-8 text-center text-[10px] tracking-[0.12em] text-zinc-700">
              PROOF • SKILL-FIRST NETWORK • BUILD PROOF. GET DISCOVERED.
            </p>

          </div>
        </section>
      </div>
    </main>
  );
}
