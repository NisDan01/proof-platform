export type InterviewStage =
  | "screening"
  | "technical"
  | "practical"
  | "final"
  | "completed"
  | "cancelled";

export interface ProofInterview {
  id: string;
  candidateId: string;
  companyId: string;
  opportunityId: string;
  stage: InterviewStage;
  startsAt: string;
  endsAt: string;
  timezone: string;
  meetingUrl?: string;
  notes?: string;
}

export interface InterviewValidation {
  valid: boolean;
  errors: string[];
}

export function validateInterview(
  interview: ProofInterview,
): InterviewValidation {
  const errors: string[] = [];
  const start = Date.parse(interview.startsAt);
  const end = Date.parse(interview.endsAt);

  if (!interview.candidateId.trim()) errors.push("Candidate is required.");
  if (!interview.companyId.trim()) errors.push("Company is required.");
  if (!interview.opportunityId.trim()) errors.push("Opportunity is required.");
  if (Number.isNaN(start) || Number.isNaN(end)) {
    errors.push("A valid interview date is required.");
  } else if (end <= start) {
    errors.push("Interview end must be after its start.");
  } else if (start < Date.now()) {
    errors.push("Interview cannot be scheduled in the past.");
  }

  if (!interview.timezone.trim()) errors.push("Timezone is required.");

  return { valid: errors.length === 0, errors };
}

export function getInterviewDurationMinutes(
  interview: ProofInterview,
): number {
  const duration =
    Date.parse(interview.endsAt) - Date.parse(interview.startsAt);

  return Number.isFinite(duration) && duration > 0
    ? Math.round(duration / 60000)
    : 0;
}

export function canMoveInterviewStage(
  current: InterviewStage,
  next: InterviewStage,
): boolean {
  const allowed: Record<InterviewStage, InterviewStage[]> = {
    screening: ["technical", "cancelled"],
    technical: ["practical", "final", "cancelled"],
    practical: ["final", "cancelled"],
    final: ["completed", "cancelled"],
    completed: [],
    cancelled: [],
  };

  return allowed[current].includes(next);
}

export function getInterviewStageLabel(
  stage: InterviewStage,
): string {
  const labels: Record<InterviewStage, string> = {
    screening: "Initial screening",
    technical: "Technical interview",
    practical: "Practical assessment",
    final: "Final interview",
    completed: "Completed",
    cancelled: "Cancelled",
  };

  return labels[stage];
}

export function sortInterviews(
  items: ProofInterview[],
): ProofInterview[] {
  return [...items].sort(
    (a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt),
  );
}
