export const HIRING_STAGES = [
  "applied",
  "screened",
  "assessment",
  "shortlisted",
  "interview",
  "offered",
  "hired",
] as const;

export type HiringStage = (typeof HIRING_STAGES)[number];

export interface HiringPipelineEvent {
  candidateId: string;
  stage: HiringStage;
  occurredAt: string;
}

export interface StageAnalytics {
  stage: HiringStage;
  candidates: number;
  conversionFromPrevious: number | null;
}

export interface HiringPipelineReport {
  totalCandidates: number;
  hiredCandidates: number;
  rejectedCandidates: number;
  overallHireRate: number;
  averageDaysToHire: number | null;
  stages: StageAnalytics[];
  dataQualityIssues: string[];
}

const round = (value: number) =>
  Math.round(value * 100) / 100;

export function analyzeHiringPipeline(
  events: HiringPipelineEvent[],
  rejectedCandidateIds: string[] = [],
): HiringPipelineReport {
  const issues: string[] = [];
  const candidateStages = new Map<
    string,
    Map<HiringStage, number>
  >();

  for (const event of events) {
    if (!event.candidateId.trim()) {
      issues.push("An event with an empty candidate ID was ignored.");
      continue;
    }

    const timestamp = new Date(event.occurredAt).getTime();

    if (!Number.isFinite(timestamp)) {
      issues.push(
        `Invalid timestamp ignored for candidate ${event.candidateId}.`,
      );
      continue;
    }

    if (!HIRING_STAGES.includes(event.stage)) {
      issues.push(
        `Unknown stage ignored for candidate ${event.candidateId}.`,
      );
      continue;
    }

    const stages =
      candidateStages.get(event.candidateId) ??
      new Map<HiringStage, number>();

    const existing = stages.get(event.stage);

    if (existing === undefined || timestamp < existing) {
      stages.set(event.stage, timestamp);
    }

    candidateStages.set(event.candidateId, stages);
  }

  const stageCounts = new Map<HiringStage, number>();

  for (const stage of HIRING_STAGES) {
    stageCounts.set(stage, 0);
  }

  let totalHireDays = 0;
  let hireDurations = 0;
  let hiredCandidates = 0;

  for (const stages of candidateStages.values()) {
    for (const stage of HIRING_STAGES) {
      if (stages.has(stage)) {
        stageCounts.set(
          stage,
          (stageCounts.get(stage) ?? 0) + 1,
        );
      }
    }

    const appliedAt = stages.get("applied");
    const hiredAt = stages.get("hired");

    if (hiredAt !== undefined) {
      hiredCandidates++;

      if (appliedAt !== undefined && hiredAt >= appliedAt) {
        totalHireDays +=
          (hiredAt - appliedAt) / (1000 * 60 * 60 * 24);
        hireDurations++;
      } else {
        issues.push(
          "A hired candidate has missing or inconsistent application timing.",
        );
      }
    }
  }

  const totalCandidates = candidateStages.size;
  const rejected = new Set(rejectedCandidateIds).size;

  const stages: StageAnalytics[] = HIRING_STAGES.map(
    (stage, index) => {
      const candidates = stageCounts.get(stage) ?? 0;
      const previous =
        index === 0
          ? null
          : stageCounts.get(HIRING_STAGES[index - 1]) ?? 0;

      return {
        stage,
        candidates,
        conversionFromPrevious:
          previous === null
            ? null
            : previous === 0
              ? 0
              : round((candidates / previous) * 100),
      };
    },
  );

  return {
    totalCandidates,
    hiredCandidates,
    rejectedCandidates: rejected,
    overallHireRate:
      totalCandidates === 0
        ? 0
        : round((hiredCandidates / totalCandidates) * 100),
    averageDaysToHire:
      hireDurations === 0
        ? null
        : round(totalHireDays / hireDurations),
    stages,
    dataQualityIssues: issues,
  };
}
