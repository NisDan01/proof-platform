export type SkillLevel = "beginner" | "intermediate" | "advanced" | "expert";

export type HiringStage =
  | "applied"
  | "screening"
  | "challenge"
  | "interview"
  | "offered"
  | "hired"
  | "rejected";

export interface SkillScore {
  skill: string;
  score: number;
  verified: boolean;
}

export interface Candidate {
  id: string;
  name: string;
  email?: string;
  skills: SkillScore[];
  experienceYears?: number;
  createdAt: string;
}

export interface SkillRequirement {
  skill: string;
  minimumScore: number;
  weight: number;
  required: boolean;
}

export interface Opportunity {
  id: string;
  title: string;
  companyId: string;
  requirements: SkillRequirement[];
  status: "draft" | "published" | "paused" | "closed";
  createdAt: string;
}

export interface ChallengeAttempt {
  id: string;
  candidateId: string;
  challengeId: string;
  score: number;
  maxScore: number;
  completedAt: string;
  durationSeconds: number;
  skill: string;
}

export interface EvaluationDimension {
  name: string;
  score: number;
  weight: number;
  feedback?: string;
}

export interface EvaluationResult {
  score: number;
  grade: string;
  passed: boolean;
  dimensions: EvaluationDimension[];
  feedback: string[];
}

export interface Application {
  id: string;
  candidateId: string;
  opportunityId: string;
  stage: HiringStage;
  appliedAt: string;
  updatedAt: string;
  notes?: string;
}

export interface AuditEvent {
  id: string;
  actorId: string;
  action: string;
  resource: string;
  resourceId: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}
