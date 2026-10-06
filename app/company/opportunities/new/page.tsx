"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Skill = {
  id: string;
  name: string;
};

export default function NewOpportunityPage() {
  const supabase = createClient();
  const router = useRouter();

  const [companyId, setCompanyId] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [skills, setSkills] = useState<Skill[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [skillScores, setSkillScores] = useState<Record<string, number>>({});

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("Job");
  const [location, setLocation] = useState("");
  const [remote, setRemote] = useState(true);
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadForm();
  }, []);

  async function loadForm() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/auth";
      return;
    }

    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("id, name")
      .eq("owner_id", user.id)
      .limit(1)
      .maybeSingle();

    if (companyError || !company) {
      setError("No company profile found.");
      setLoading(false);
      return;
    }

    setCompanyId(company.id);
    setCompanyName(company.name);

    const { data: skillData, error: skillError } = await supabase
      .from("skills")
      .select("id, name")
      .order("name");

    if (skillError) {
      console.error("PROOF skills error:", skillError);
    } else {
      setSkills(skillData ?? []);
    }

    setLoading(false);
  }

  function toggleSkill(skillId: string) {
    setSelectedSkills((current) => {
      if (current.includes(skillId)) {
        return current.filter((id) => id !== skillId);
      }

      setSkillScores((scores) => ({
        ...scores,
        [skillId]: scores[skillId] ?? 70,
      }));

      return [...current, skillId];
    });
  }

  function updateSkillScore(skillId: string, value: number) {
    setSkillScores((current) => ({
      ...current,
      [skillId]: Math.min(100, Math.max(50, value)),
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!companyId) {
      setError("Company profile not found.");
      return;
    }

    if (!title.trim()) {
      setError("Please enter an opportunity title.");
      return;
    }

    if (!description.trim()) {
      setError("Please enter a description.");
      return;
    }

    setSaving(true);
    setError("");

    const { data: opportunity, error: opportunityError } =
      await supabase
        .from("opportunities")
        .insert({
          title: title.trim(),
          company_name: companyName,
          description: description.trim(),
          opportunity_type: type,
          location: location.trim() || null,
          remote,
          salary_min: salaryMin ? Number(salaryMin) : null,
          salary_max: salaryMax ? Number(salaryMax) : null,
          currency: "INR",
          status: "open",
          company_id: companyId,
        })
        .select("id")
        .single();

    if (opportunityError || !opportunity) {
      console.error(
        "PROOF opportunity creation error:",
        opportunityError,
      );
      setError(
        opportunityError?.message ||
          "Unable to create opportunity.",
      );
      setSaving(false);
      return;
    }

    if (selectedSkills.length > 0) {
      const skillRows = selectedSkills.map((skillId) => ({
        opportunity_id: opportunity.id,
        skill_id: skillId,
        required_score: skillScores[skillId] ?? 70,
      }));

      const { error: skillInsertError } = await supabase
        .from("opportunity_skills")
        .insert(skillRows);

      if (skillInsertError) {
        console.error(
          "PROOF opportunity skills error:",
          skillInsertError,
        );

        await supabase
          .from("opportunities")
          .delete()
          .eq("id", opportunity.id);

        setError(
          "Opportunity could not save its required skills.",
        );
        setSaving(false);
        return;
      }
    }

    router.push("/company");
    router.refresh();
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#050816] text-white">
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-white/50">
            Loading opportunity form...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050816] text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-10%] top-[-15%] h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-[140px]" />
        <div className="absolute right-[-10%] top-[20%] h-[450px] w-[450px] rounded-full bg-violet-500/10 blur-[140px]" />
      </div>

      <div className="relative mx-auto max-w-4xl px-6 py-8 md:px-10">
        <header className="flex items-center justify-between border-b border-white/10 pb-6">
          <Link
            href="/company"
            className="text-2xl font-bold tracking-[-0.05em]"
          >
            PROOF<span className="text-cyan-400">.</span>
          </Link>

          <Link
            href="/company"
            className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/60 transition hover:bg-white/5 hover:text-white"
          >
            Back to company
          </Link>
        </header>

        <section className="pt-12">
          <p className="text-sm font-medium text-cyan-400">
            HIRING
          </p>

          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            Post an opportunity
          </h1>

          <p className="mt-4 text-white/45">
            Create a skill-first opportunity for candidates on PROOF.
          </p>
        </section>

        <form
          onSubmit={handleSubmit}
          className="mt-10 space-y-6"
        >
          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 md:p-8">
            <p className="text-sm text-white/40">
              Opportunity details
            </p>

            <div className="mt-6 space-y-5">
              <div>
                <label className="text-sm text-white/70">
                  Title
                </label>

                <input
                  value={title}
                  onChange={(event) =>
                    setTitle(event.target.value)
                  }
                  placeholder="e.g. AI Response Evaluator"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition placeholder:text-white/20 focus:border-cyan-400/40"
                />
              </div>

              <div>
                <label className="text-sm text-white/70">
                  Description
                </label>

                <textarea
                  value={description}
                  onChange={(event) =>
                    setDescription(event.target.value)
                  }
                  rows={6}
                  placeholder="Describe the role, responsibilities and what the candidate will work on..."
                  className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition placeholder:text-white/20 focus:border-cyan-400/40"
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="text-sm text-white/70">
                    Opportunity type
                  </label>

                  <select
                    value={type}
                    onChange={(event) =>
                      setType(event.target.value)
                    }
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-[#0b1020] px-4 py-3 text-white outline-none focus:border-cyan-400/40"
                  >
                    <option>Job</option>
                    <option>Project</option>
                    <option>Internship</option>
                    <option>Challenge</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm text-white/70">
                    Location
                  </label>

                  <input
                    value={location}
                    onChange={(event) =>
                      setLocation(event.target.value)
                    }
                    placeholder="e.g. Delhi, India"
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition placeholder:text-white/20 focus:border-cyan-400/40"
                  />
                </div>
              </div>

              <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
                <input
                  type="checkbox"
                  checked={remote}
                  onChange={(event) =>
                    setRemote(event.target.checked)
                  }
                  className="h-4 w-4 accent-cyan-400"
                />

                <span>
                  <span className="block text-sm font-medium">
                    Remote opportunity
                  </span>
                  <span className="mt-1 block text-xs text-white/35">
                    Candidates can apply from anywhere.
                  </span>
                </span>
              </label>
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 md:p-8">
            <p className="text-sm text-white/40">
              Compensation
            </p>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div>
                <label className="text-sm text-white/70">
                  Minimum salary (INR)
                </label>

                <input
                  type="number"
                  min="0"
                  value={salaryMin}
                  onChange={(event) =>
                    setSalaryMin(event.target.value)
                  }
                  placeholder="400000"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none placeholder:text-white/20 focus:border-cyan-400/40"
                />
              </div>

              <div>
                <label className="text-sm text-white/70">
                  Maximum salary (INR)
                </label>

                <input
                  type="number"
                  min="0"
                  value={salaryMax}
                  onChange={(event) =>
                    setSalaryMax(event.target.value)
                  }
                  placeholder="700000"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none placeholder:text-white/20 focus:border-cyan-400/40"
                />
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 md:p-8">
            <p className="text-sm text-white/40">
              Required skills
            </p>

            <p className="mt-2 text-sm text-white/35">
              Select the skills candidates should have.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {skills.map((skill) => {
                const selected = selectedSkills.includes(
                  skill.id,
                );

                return (
                  <button
                    key={skill.id}
                    type="button"
                    onClick={() => toggleSkill(skill.id)}
                    className={`rounded-2xl border p-4 text-left transition ${
                      selected
                        ? "border-cyan-400/40 bg-cyan-400/10"
                        : "border-white/10 bg-black/20 hover:bg-white/[0.05]"
                    }`}
                  >
                    <span
                      className={
                        selected
                          ? "text-cyan-300"
                          : "text-white/70"
                      }
                    >
                      {selected ? "✓ " : ""}
                      {skill.name}
                    </span>

                    {selected && (
                      <div
                        className="mt-4 flex items-center justify-between gap-4"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <span className="text-xs text-white/35">
                          Minimum score
                        </span>

                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="50"
                            max="100"
                            value={skillScores[skill.id] ?? 70}
                            onChange={(event) =>
                              updateSkillScore(
                                skill.id,
                                Number(event.target.value)
                              )
                            }
                            className="w-16 rounded-lg border border-white/10 bg-black/30 px-2 py-1.5 text-center text-xs text-white outline-none focus:border-cyan-400/40"
                          />
                          <span className="text-xs text-white/30">
                            / 100
                          </span>
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {error && (
            <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300">
              {error}
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link
              href="/company"
              className="rounded-2xl border border-white/10 px-6 py-3 text-center text-sm text-white/60 transition hover:bg-white/5 hover:text-white"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="rounded-2xl bg-white px-7 py-3 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Publishing..."
                : "Publish opportunity →"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
