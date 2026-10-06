"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

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

export default function OpportunitiesPage() {
  const supabase = createClient();

  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOpportunities() {
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
        .eq("status", "open")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("PROOF opportunities error:", error);
        setLoading(false);
        return;
      }

      setOpportunities(data ?? []);
      setLoading(false);
    }

    loadOpportunities();
  }, []);

  return (
    <main className="min-h-screen bg-[#050507] text-white">
      <div className="mx-auto max-w-7xl px-6 py-10">

        <header className="mb-14 flex items-center justify-between">
          <Link
            href="/"
            className="text-xl font-semibold tracking-tight"
          >
            PROOF<span className="text-cyan-400">.</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="rounded-full border border-white/10 px-5 py-2.5 text-sm text-white/70 transition hover:bg-white/[0.05]"
            >
              Dashboard
            </Link>

            <Link
              href="/challenges"
              className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black transition hover:bg-white/90"
            >
              Challenges
            </Link>
          </div>
        </header>

        <section className="mb-12 max-w-3xl">
          <p className="text-sm uppercase tracking-[0.2em] text-cyan-400">
            Opportunities
          </p>

          <h1 className="mt-3 text-5xl font-semibold tracking-tight">
            Find opportunities that match your proof.
          </h1>

          <p className="mt-5 text-lg leading-8 text-white/50">
            Jobs, projects and internships where your verified skills can
            speak louder than your resume.
          </p>
        </section>

        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-10 text-white/40">
            Loading opportunities...
          </div>
        ) : opportunities.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-10 text-center">
            <h2 className="text-xl font-semibold">
              No opportunities available
            </h2>

            <p className="mt-3 text-white/40">
              New opportunities will appear here soon.
            </p>
          </div>
        ) : (
          <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {opportunities.map((opportunity) => (
              <Link
                key={opportunity.id}
                href={`/opportunities/${opportunity.id}`}
                className="group rounded-3xl border border-white/10 bg-white/[0.04] p-6 transition duration-300 hover:-translate-y-1 hover:border-cyan-400/30 hover:bg-white/[0.06]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-300">
                      {opportunity.opportunity_type}
                    </span>

                    <h2 className="mt-5 text-xl font-semibold">
                      {opportunity.title}
                    </h2>

                    <p className="mt-2 text-sm text-white/50">
                      {opportunity.company_name}
                    </p>
                  </div>

                  <span className="text-white/20 transition group-hover:text-cyan-400">
                    ↗
                  </span>
                </div>

                <p className="mt-6 line-clamp-3 text-sm leading-6 text-white/50">
                  {opportunity.description}
                </p>

                <div className="mt-6 flex flex-wrap gap-2">
                  {opportunity.remote && (
                    <span className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/50">
                      Remote
                    </span>
                  )}

                  {!opportunity.remote && opportunity.location && (
                    <span className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/50">
                      {opportunity.location}
                    </span>
                  )}
                </div>

                {opportunity.salary_min && opportunity.salary_max && (
                  <div className="mt-6 border-t border-white/10 pt-5">
                    <p className="text-sm text-white/40">Compensation</p>

                    <p className="mt-1 font-medium">
                      ₹{opportunity.salary_min.toLocaleString("en-IN")}
                      {" – "}
                      ₹{opportunity.salary_max.toLocaleString("en-IN")}
                    </p>
                  </div>
                )}

                <div className="mt-6 text-sm text-cyan-400">
                  View opportunity →
                </div>
              </Link>
            ))}
          </section>
        )}

      </div>
    </main>
  );
}
