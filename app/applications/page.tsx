"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Application = {
  id: string;
  status: string;
  created_at: string;
  updated_at: string;
  opportunity_id: string;
  opportunities: {
    title: string;
    company_name: string;
    opportunity_type: string;
    location: string | null;
    remote: boolean;
  } | null;
};

export default function ApplicationsPage() {
  const supabase = createClient();

  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadApplications() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/auth";
        return;
      }

      const { data, error } = await supabase
        .from("applications")
        .select(`
          id,
          status,
          created_at,
          updated_at,
          opportunity_id,
          opportunities (
            title,
            company_name,
            opportunity_type,
            location,
            remote
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("PROOF applications error:", error);
        setLoading(false);
        return;
      }

      setApplications((data ?? []) as unknown as Application[]);
      setLoading(false);
    }

    loadApplications();
  }, []);

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function statusStyle(status: string) {
    switch (status) {
      case "shortlisted":
        return "border-cyan-400/20 bg-cyan-400/10 text-cyan-300";
      case "interview":
        return "border-purple-400/20 bg-purple-400/10 text-purple-300";
      case "hired":
        return "border-green-400/20 bg-green-400/10 text-green-300";
      case "rejected":
        return "border-red-400/20 bg-red-400/10 text-red-300";
      default:
        return "border-white/10 bg-white/[0.04] text-white/50";
    }
  }

  return (
    <main className="min-h-screen bg-[#050507] text-white">
      <div className="mx-auto max-w-6xl px-6 py-10">

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
              href="/opportunities"
              className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black transition hover:bg-white/90"
            >
              Find Opportunities
            </Link>
          </div>
        </header>

        <section className="mb-12 max-w-3xl">
          <p className="text-sm uppercase tracking-[0.2em] text-cyan-400">
            Applications
          </p>

          <h1 className="mt-3 text-5xl font-semibold tracking-tight">
            Your applications.
          </h1>

          <p className="mt-5 text-lg leading-8 text-white/50">
            Track every opportunity you have applied to through PROOF.
          </p>
        </section>

        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-10 text-white/40">
            Loading applications...
          </div>
        ) : applications.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-12 text-center">
            <h2 className="text-xl font-semibold">
              No applications yet
            </h2>

            <p className="mt-3 text-white/40">
              Apply to an opportunity and it will appear here.
            </p>

            <Link
              href="/opportunities"
              className="mt-7 inline-flex rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition hover:bg-white/90"
            >
              Explore Opportunities
            </Link>
          </div>
        ) : (
          <section className="space-y-4">
            {applications.map((application) => {
              const opportunity = application.opportunities;

              if (!opportunity) return null;

              return (
                <Link
                  key={application.id}
                  href={`/opportunities/${application.opportunity_id}`}
                  className="group block rounded-3xl border border-white/10 bg-white/[0.04] p-6 transition duration-300 hover:-translate-y-0.5 hover:border-cyan-400/30 hover:bg-white/[0.06]"
                >
                  <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-300">
                          {opportunity.opportunity_type}
                        </span>

                        <span className="text-xs text-white/30">
                          Applied {formatDate(application.created_at)}
                        </span>

                        {application.updated_at &&
                          application.updated_at !== application.created_at && (
                            <span className="text-xs text-cyan-300/50">
                              Updated {formatDate(application.updated_at)}
                            </span>
                          )}
                      </div>

                      <h2 className="mt-4 text-xl font-semibold group-hover:text-cyan-300">
                        {opportunity.title}
                      </h2>

                      <p className="mt-2 text-sm text-white/50">
                        {opportunity.company_name}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {opportunity.remote && (
                          <span className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/50">
                            Remote
                          </span>
                        )}

                        {opportunity.location &&
                          opportunity.location !== "Remote" && (
                            <span className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/50">
                              {opportunity.location}
                            </span>
                          )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-4">
                      {application.status === "rejected" ? (
                        <div className="rounded-2xl border border-red-400/15 bg-red-400/[0.06] px-5 py-3 text-right">
                          <p className="text-xs uppercase tracking-[0.18em] text-red-300/60">
                            Application status
                          </p>
                          <p className="mt-1 text-sm font-semibold text-red-300">
                            Not selected
                          </p>
                        </div>
                      ) : (
                        <div className="w-full max-w-[320px]">
                          {[
                            ["applied", "Applied"],
                            ["reviewing", "Reviewing"],
                            ["shortlisted", "Shortlisted"],
                            ["interview", "Interview"],
                            ["hired", "Hired"],
                          ].map(([value, label], index, stages) => {
                            const currentIndex = stages.findIndex(
                              ([stage]) => stage === application.status
                            );
                            const active = index <= currentIndex;
                            const current = value === application.status;

                            return (
                              <div
                                key={value}
                                className="flex items-center gap-3"
                              >
                                <div className="flex flex-col items-center">
                                  <span
                                    className={`h-3 w-3 rounded-full transition-all ${
                                      active
                                        ? "bg-cyan-400 shadow-[0_0_14px_rgba(34,211,238,0.5)]"
                                        : "bg-white/10"
                                    } ${
                                      current
                                        ? "scale-125 ring-4 ring-cyan-400/10"
                                        : ""
                                    }`}
                                  />
                                  {index < stages.length - 1 && (
                                    <span
                                      className={`h-5 w-px transition ${
                                        index < currentIndex
                                          ? "bg-cyan-400/60"
                                          : "bg-white/10"
                                      }`}
                                    />
                                  )}
                                </div>

                                <span
                                  className={`pb-1 text-xs transition ${
                                    current
                                      ? "font-semibold text-cyan-300"
                                      : active
                                        ? "text-white/55"
                                        : "text-white/20"
                                  }`}
                                >
                                  {label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      <span className="text-sm text-white/30 transition group-hover:text-cyan-400">
                        View opportunity →
                      </span>
                    </div>

                  </div>
                </Link>
              );
            })}
          </section>
        )}

      </div>
    </main>
  );
}
