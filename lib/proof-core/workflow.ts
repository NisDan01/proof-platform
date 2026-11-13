export type HiringStage =
  | "applied"
  | "screening"
  | "challenge"
  | "shortlisted"
  | "interview"
  | "offered"
  | "hired"
  | "rejected";

export interface CandidateRecord {
  id: string;
  name: string;
  email: string;
  skills: string[];
  score: number;
  appliedAt: string;
  stage: HiringStage;
}

export interface HiringEvent {
  id: string;
  candidateId: string;
  from: HiringStage | null;
  to: HiringStage;
  actorId: string;
  note?: string;
  createdAt: string;
}

export interface HiringPolicy {
  minimumScore: number;
  requiredSkills: string[];
  maximumCandidates?: number;
  allowedStages: HiringStage[];
}

export interface HiringDecision {
  eligible: boolean;
  score: number;
  missingSkills: string[];
  reasons: string[];
}

export const HIRING_STAGES: HiringStage[] = [
  "applied",
  "screening",
  "challenge",
  "shortlisted",
  "interview",
  "offered",
  "hired",
  "rejected",
];

const TERMINAL_STAGES = new Set<HiringStage>(["hired", "rejected"]);

const TRANSITIONS: Record<HiringStage, HiringStage[]> = {
  applied: ["screening", "rejected"],
  screening: ["challenge", "shortlisted", "rejected"],
  challenge: ["shortlisted", "rejected"],
  shortlisted: ["interview", "rejected"],
  interview: ["offered", "rejected"],
  offered: ["hired", "rejected"],
  hired: [],
  rejected: [],
};

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function validScore(score: number): boolean {
  return Number.isFinite(score) && score >= 0 && score <= 100;
}

export function evaluateCandidate(
  candidate: CandidateRecord,
  policy: HiringPolicy,
): HiringDecision {
  const reasons: string[] = [];
  const missingSkills = policy.requiredSkills.filter(
    (required) =>
      !candidate.skills.some(
        (skill) => normalize(skill) === normalize(required),
      ),
  );

  if (!validScore(candidate.score)) {
    reasons.push("Candidate score must be between 0 and 100.");
  }

  if (candidate.score < policy.minimumScore) {
    reasons.push("Candidate score is below the minimum requirement.");
  }

  if (missingSkills.length > 0) {
    reasons.push("One or more required skills are missing.");
  }

  if (!policy.allowedStages.includes(candidate.stage)) {
    reasons.push("Candidate stage is not allowed by this hiring policy.");
  }

  return {
    eligible: reasons.length === 0,
    score: validScore(candidate.score) ? candidate.score : 0,
    missingSkills,
    reasons,
  };
}

export function canTransition(
  current: HiringStage,
  next: HiringStage,
): boolean {
  return TRANSITIONS[current].includes(next);
}

export function transitionCandidate(
  candidate: CandidateRecord,
  next: HiringStage,
  actorId: string,
  note = "",
): { candidate: CandidateRecord; event: HiringEvent } {
  if (!actorId.trim()) {
    throw new Error("An authenticated actor is required.");
  }

  if (!canTransition(candidate.stage, next)) {
    throw new Error(
      `Invalid hiring transition: ${candidate.stage} -> ${next}`,
    );
  }

  const updated = { ...candidate, stage: next };

  return {
    candidate: updated,
    event: {
      id: crypto.randomUUID(),
      candidateId: candidate.id,
      from: candidate.stage,
      to: next,
      actorId,
      note: note.trim() || undefined,
      createdAt: new Date().toISOString(),
    },
  };
}

export function rankCandidates(
  candidates: CandidateRecord[],
  policy: HiringPolicy,
): CandidateRecord[] {
  return [...candidates]
    .filter((candidate) => evaluateCandidate(candidate, policy).eligible)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (
        new Date(a.appliedAt).getTime() -
        new Date(b.appliedAt).getTime()
      );
    })
    .slice(0, policy.maximumCandidates ?? candidates.length);
}

export function summarizeHiringPipeline(
  candidates: CandidateRecord[],
): Record<HiringStage, number> {
  const summary = Object.fromEntries(
    HIRING_STAGES.map((stage) => [stage, 0]),
  ) as Record<HiringStage, number>;

  for (const candidate of candidates) {
    summary[candidate.stage] += 1;
  }

  return summary;
}

export function hiringConversionRate(
  candidates: CandidateRecord[],
): number {
  if (candidates.length === 0) return 0;

  const hired = candidates.filter(
    (candidate) => candidate.stage === "hired",
  ).length;

  return Math.round((hired / candidates.length) * 10000) / 100;
}

export function averageCandidateScore(
  candidates: CandidateRecord[],
): number {
  const valid = candidates.filter((candidate) =>
    validScore(candidate.score),
  );

  if (valid.length === 0) return 0;

  const total = valid.reduce((sum, candidate) => sum + candidate.score, 0);
  return Math.round((total / valid.length) * 100) / 100;
}

export function validateHiringPolicy(
  policy: HiringPolicy,
): string[] {
  const errors: string[] = [];

  if (!validScore(policy.minimumScore)) {
    errors.push("Minimum score must be between 0 and 100.");
  }

  if (policy.requiredSkills.some((skill) => !skill.trim())) {
    errors.push("Required skills cannot contain empty values.");
  }

  if (
    policy.maximumCandidates !== undefined &&
    (!Number.isInteger(policy.maximumCandidates) ||
      policy.maximumCandidates < 1)
  ) {
    errors.push("Maximum candidates must be a positive integer.");
  }

  if (policy.allowedStages.length === 0) {
    errors.push("At least one hiring stage must be allowed.");
  }

  return errors;
}

export function buildHiringAudit(
  events: HiringEvent[],
  candidateId: string,
): HiringEvent[] {
  return events
    .filter((event) => event.candidateId === candidateId)
    .slice()
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() -
        new Date(b.createdAt).getTime(),
    );
}

export function calculateSkillCoverage(
  candidate: CandidateRecord,
  requiredSkills: string[],
): number {
  if (requiredSkills.length === 0) return 100;

  const matched = requiredSkills.filter((required) =>
    candidate.skills.some(
      (skill) => normalize(skill) === normalize(required),
    ),
  ).length;

  return Math.round((matched / requiredSkills.length) * 100);
}

export function compareCandidates(
  first: CandidateRecord,
  second: CandidateRecord,
  requiredSkills: string[],
): number {
  const firstCoverage = calculateSkillCoverage(first, requiredSkills);
  const secondCoverage = calculateSkillCoverage(second, requiredSkills);

  const firstComposite = first.score * 0.7 + firstCoverage * 0.3;
  const secondComposite = second.score * 0.7 + secondCoverage * 0.3;

  return Math.round((firstComposite - secondComposite) * 100) / 100;
}

export function getAvailableTransitions(
  stage: HiringStage,
): HiringStage[] {
  return [...TRANSITIONS[stage]];
}

export function isTerminalStage(stage: HiringStage): boolean {
  return TERMINAL_STAGES.has(stage);
}
