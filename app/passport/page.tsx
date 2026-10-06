"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Skill = {
  id: string;
  name: string;
  description: string | null;
  score: number;
  verified: boolean;
  updated_at: string;
};

export default function PassportPage() {
  const supabase = createClient();

  const [skills, setSkills] = useState<Skill[]>([]);
  const [name, setName] = useState("Candidate");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPassport() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/auth";
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, username")
        .eq("id", user.id)
        .single();

      setName(profile?.full_name || profile?.username || "Candidate");

      const { data: userSkills, error: userSkillsError } = await supabase
        .from("user_skills")
        .select("skill_id, score, verified, updated_at")
        .eq("user_id", user.id);

      if (userSkillsError) {
        console.error("PROOF passport skills error:", userSkillsError);
        setLoading(false);
        return;
      }

      const skillIds = userSkills?.map((item) => item.skill_id) ?? [];

      if (skillIds.length === 0) {
        setSkills([]);
        setLoading(false);
        return;
      }

      const { data: skillData } = await supabase
        .from("skills")
        .select("id, name, description")
        .in("id", skillIds);

      const skillMap = new Map(
        (skillData ?? []).map((skill) => [skill.id, skill])
      );

      setSkills(
        (userSkills ?? []).map((item) => {
          const skill = skillMap.get(item.skill_id);

          return {
            id: item.skill_id,
            name: skill?.name ?? "Unknown Skill",
            description: skill?.description ?? null,
            score: item.score ?? 0,
            verified: item.verified ?? false,
            updated_at: item.updated_at,
          };
        })
      );

      setLoading(false);
    }

    loadPassport();
  }, []);

  const verifiedCount = skills.filter((skill) => skill.verified).length;

  return (
    <main className="min-h-screen bg-[#050507] text-white">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <header className="mb-12 flex items-center justify-between">
          <Link href="/" className="text-xl font-semibold">
            PROOF<span className="text-cyan-400">.</span>
          </Link>

          <Link
            href="/dashboard"
            className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm text-white/70 hover:bg-white/[0.08]"
          >
            Dashboard
          </Link>
        </header>

        <section className="mb-12">
          <p className="mb-3 text-sm uppercase tracking-[0.2em] text-cyan-400">
            Verified Identity
          </p>

          <h1 className="text-5xl font-semibold tracking-tight">
            {name}'s Skill Passport
          </h1>

          <p className="mt-4 max-w-2xl text-white/50">
            A proof-based record of skills verified through practical
            challenges on PROOF.
          </p>
        </section>

        <section className="mb-12 grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <p className="text-sm text-white/40">Total Skills</p>
            <p className="mt-3 text-4xl font-semibold">{skills.length}</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <p className="text-sm text-white/40">Verified</p>
            <p className="mt-3 text-4xl font-semibold">{verifiedCount}</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <p className="text-sm text-white/40">Average Score</p>
            <p className="mt-3 text-4xl font-semibold">
              {skills.length
                ? Math.round(
                    skills.reduce((sum, skill) => sum + skill.score, 0) /
                      skills.length
                  )
                : 0}
            </p>
          </div>
        </section>

        <section>
          <div className="mb-6">
            <p className="text-sm uppercase tracking-[0.18em] text-white/40">
              Skill Evidence
            </p>
            <h2 className="mt-2 text-2xl font-semibold">
              Your verified capabilities
            </h2>
          </div>

          {loading ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-white/40">
              Loading passport...
            </div>
          ) : skills.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-white/40">
              Complete a challenge to start building your Skill Passport.
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {skills.map((skill) => (
                <div
                  key={skill.id}
                  className="rounded-3xl border border-white/10 bg-white/[0.04] p-7 transition hover:-translate-y-1 hover:bg-white/[0.06]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-semibold">{skill.name}</h3>

                      {skill.description && (
                        <p className="mt-2 text-sm leading-6 text-white/45">
                          {skill.description}
                        </p>
                      )}
                    </div>

                    {skill.verified && (
                      <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-400">
                        ✓ Verified
                      </span>
                    )}
                  </div>

                  <div className="mt-8">
                    <div className="flex items-end justify-between">
                      <span className="text-5xl font-semibold">
                        {skill.score}
                      </span>

                      <span className="text-sm text-white/30">/100</span>
                    </div>

                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-cyan-400 transition-all duration-700"
                        style={{ width: `${skill.score}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-6 border-t border-white/10 pt-4 text-xs text-white/30">
                    Last updated{" "}
                    {new Date(skill.updated_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="mt-12 flex flex-wrap gap-4">
          <Link
            href="/challenges"
            className="rounded-full bg-white px-6 py-3 text-sm font-medium text-black hover:bg-white/90"
          >
            Take another challenge
          </Link>

          <Link
            href="/dashboard"
            className="rounded-full border border-white/10 px-6 py-3 text-sm text-white/70 hover:bg-white/[0.05]"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
