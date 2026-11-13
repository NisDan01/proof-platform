import type { EvaluationInput } from "./types";
import { DEFAULT_RUBRIC, validateRubricWeights } from "./rubric";

export function validateEvaluationInput(
  input: EvaluationInput
): string[] {
  const errors: string[] = [];

  if (!input.challengeId?.trim()) {
    errors.push("Challenge ID is required.");
  }

  if (!input.candidateId?.trim()) {
    errors.push("Candidate ID is required.");
  }

  if (!input.responseA?.trim()) {
    errors.push("Response A is required.");
  }

  if (!input.responseB?.trim()) {
    errors.push("Response B is required.");
  }

  if (!["A", "B"].includes(input.selectedResponse)) {
    errors.push("Selected response must be A or B.");
  }

  if (!Array.isArray(input.scores)) {
    errors.push("Evaluation scores must be an array.");
    return errors;
  }

  const submitted = new Set(
    input.scores.map((item) => item.dimension)
  );

  if (submitted.size !== input.scores.length) {
    errors.push("Duplicate evaluation dimensions are not allowed.");
  }

  for (const criterion of DEFAULT_RUBRIC) {
    const score = input.scores.find(
      (item) => item.dimension === criterion.id
    );

    if (!score) {
      errors.push(`Missing score: ${criterion.id}`);
      continue;
    }

    if (!Number.isFinite(score.score) || score.score < 0 || score.score > 5) {
      errors.push(`Invalid score for ${criterion.id}.`);
    }

    if (score.weight !== criterion.weight) {
      errors.push(`Invalid rubric weight for ${criterion.id}.`);
    }

    if (typeof score.feedback !== "string") {
      errors.push(`Feedback must be text for ${criterion.id}.`);
    }
  }

  if (input.scores.length !== DEFAULT_RUBRIC.length) {
    errors.push("All rubric dimensions must be submitted.");
  }

  if (!validateRubricWeights()) {
    errors.push("The default rubric weights are invalid.");
  }

  return errors;
}

export function assertValidEvaluation(input: EvaluationInput): void {
  const errors = validateEvaluationInput(input);

  if (errors.length > 0) {
    throw new Error(errors.join(" "));
  }
}
