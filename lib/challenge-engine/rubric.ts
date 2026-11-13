import type { EvaluationDimension } from "./types";

export interface RubricCriterion {
  id: EvaluationDimension;
  title: string;
  description: string;
  weight: number;
  maxScore: number;
}

export const DEFAULT_RUBRIC: RubricCriterion[] = [
  {
    id: "accuracy",
    title: "Factual Accuracy",
    description: "Checks correctness and unsupported claims.",
    weight: 0.30,
    maxScore: 5,
  },
  {
    id: "relevance",
    title: "Relevance",
    description: "Checks whether the response addresses the task.",
    weight: 0.25,
    maxScore: 5,
  },
  {
    id: "clarity",
    title: "Clarity",
    description: "Checks readability and communication.",
    weight: 0.15,
    maxScore: 5,
  },
  {
    id: "reasoning",
    title: "Reasoning",
    description: "Checks logical consistency and explanation.",
    weight: 0.20,
    maxScore: 5,
  },
  {
    id: "instruction_following",
    title: "Instruction Following",
    description: "Checks compliance with task instructions.",
    weight: 0.10,
    maxScore: 5,
  },
];

export function getRubricCriterion(id: EvaluationDimension) {
  return DEFAULT_RUBRIC.find((item) => item.id === id);
}

export function validateRubricWeights(): boolean {
  const total = DEFAULT_RUBRIC.reduce(
    (sum, item) => sum + item.weight,
    0
  );

  return Math.abs(total - 1) < 0.0001;
}

export function getRubricDimensions(): EvaluationDimension[] {
  return DEFAULT_RUBRIC.map((item) => item.id);
}
