import type {
  DimensionScore,
  EvaluationInput,
  EvaluationResult,
} from "./types";

import { DEFAULT_RUBRIC } from "./rubric";
import { assertValidEvaluation } from "./validation";
import {
  calculateWeightedScore,
  getGrade,
  hasPassed,
} from "./scoring";

function groupFeedback(dimensions: DimensionScore[]) {
  return {
    strengths: dimensions
      .filter((item) => item.score >= 4)
      .map((item) => item.feedback || item.dimension),

    improvements: dimensions
      .filter((item) => item.score < 3)
      .map((item) => item.feedback || item.dimension),
  };
}

export function evaluateChallenge(
  input: EvaluationInput
): EvaluationResult {
  assertValidEvaluation(input);

  const orderedScores = DEFAULT_RUBRIC.map((criterion) => {
    return input.scores.find(
      (item) => item.dimension === criterion.id
    )!;
  });

  const score = calculateWeightedScore(orderedScores);
  const grade = getGrade(score);
  const feedback = groupFeedback(orderedScores);

  return {
    challengeId: input.challengeId,
    candidateId: input.candidateId,
    score,
    grade,
    passed: hasPassed(score),
    dimensions: orderedScores,
    strengths: feedback.strengths,
    improvements: feedback.improvements,
    summary:
      score >= 90
        ? "Excellent evaluation performance."
        : score >= 75
          ? "Good performance with room for improvement."
          : score >= 60
            ? "Average performance. More practice is recommended."
            : "Further practice is needed before verification.",
    evaluatedAt: new Date().toISOString(),
  };
}
