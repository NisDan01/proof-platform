export type EvaluationDimension =
  | "accuracy"
  | "relevance"
  | "clarity"
  | "reasoning"
  | "instruction_following";

export type EvaluationGrade =
  | "excellent"
  | "good"
  | "average"
  | "needs_improvement";

export interface DimensionScore {
  dimension: EvaluationDimension;
  score: number;
  weight: number;
  feedback: string;
}

export interface EvaluationInput {
  challengeId: string;
  candidateId: string;
  responseA: string;
  responseB: string;
  selectedResponse: "A" | "B";
  scores: DimensionScore[];
  evaluatorNotes?: string;
}

export interface EvaluationResult {
  challengeId: string;
  candidateId: string;
  score: number;
  grade: EvaluationGrade;
  passed: boolean;
  dimensions: DimensionScore[];
  strengths: string[];
  improvements: string[];
  summary: string;
  evaluatedAt: string;
}

export interface EvaluationSummary {
  total: number;
  average: number;
  highest: number;
  lowest: number;
  passRate: number;
}
