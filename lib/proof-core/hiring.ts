import type { Application, HiringStage } from "./types";

const transitions: Record<HiringStage, HiringStage[]> = {
  applied: ["screening", "rejected"],
  screening: ["challenge", "interview", "rejected"],
  challenge: ["interview", "rejected"],
  interview: ["offered", "rejected"],
  offered: ["hired", "rejected"],
  hired: [],
  rejected: [],
};

export interface TransitionResult {
  allowed: boolean;
  previousStage: HiringStage;
  nextStage: HiringStage;
  reason?: string;
}

export function canTransition(
  current: HiringStage,
  next: HiringStage,
): boolean {
  return transitions[current].includes(next);
}

export function transitionApplication(
  application: Application,
  nextStage: HiringStage,
  now = new Date().toISOString(),
): Application {
  if (!canTransition(application.stage, nextStage)) {
    throw new Error(
      `Invalid hiring transition: ${application.stage} -> ${nextStage}`,
    );
  }

  return {
    ...application,
    stage: nextStage,
    updatedAt: now,
  };
}

export function explainTransition(
  current: HiringStage,
  next: HiringStage,
): TransitionResult {
  const allowed = canTransition(current, next);

  return {
    allowed,
    previousStage: current,
    nextStage: next,
    reason: allowed
      ? undefined
      : `Cannot move an application from ${current} to ${next}.`,
  };
}

export function countApplicationsByStage(
  applications: Application[],
): Record<HiringStage, number> {
  const counts: Record<HiringStage, number> = {
    applied: 0,
    screening: 0,
    challenge: 0,
    interview: 0,
    offered: 0,
    hired: 0,
    rejected: 0,
  };

  for (const application of applications) {
    counts[application.stage] += 1;
  }

  return counts;
}

export function hiringConversionRate(
  applications: Application[],
): number {
  if (applications.length === 0) return 0;

  const hired = applications.filter(
    (application) => application.stage === "hired",
  ).length;

  return Math.round((hired / applications.length) * 100);
}

export function sortApplications(
  applications: Application[],
): Application[] {
  return [...applications].sort(
    (a, b) =>
      new Date(b.updatedAt).getTime() -
      new Date(a.updatedAt).getTime(),
  );
}
