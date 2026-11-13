import type {
  DimensionScore,
  EvaluationGrade,
  EvaluationSummary,
} from "./types";

export function calculateWeightedScore(
  dimensions: DimensionScore[]
): number {
  if (dimensions.length === 0) {
    throw new Error("At least one score is required.");
  }

  const totalWeight = dimensions.reduce(
    (sum, item) => sum + item.weight,
    0
  );

  if (totalWeight <= 0) {
    throw new Error("Total weight must be positive.");
  }

  const weightedTotal = dimensions.reduce((sum, item) => {
    if (!Number.isFinite(item.score) || item.score < 0 || item.score > 5) {
      throw new Error(`Invalid score: ${item.dimension}`);
    }

    if (!Number.isFinite(item.weight) || item.weight < 0) {
      throw new Error(`Invalid weight: ${item.dimension}`);
    }

    return sum + item.score * item.weight;
  }, 0);

  return Math.round((weightedTotal / (totalWeight * 5)) * 100);
}

export function getGrade(score: number): EvaluationGrade {
  if (score >= 90) return "excellent";
  if (score >= 75) return "good";
  if (score >= 60) return "average";
  return "needs_improvement";
}

export function hasPassed(
  score: number,
  minimumScore = 70
): boolean {
  if (minimumScore < 0 || minimumScore > 100) {
    throw new Error("Minimum score must be between 0 and 100.");
  }

  return score >= minimumScore;
}

export function summarizeScores(
  scores: number[],
  passingScore = 70
): EvaluationSummary {
  if (scores.length === 0) {
    return {
      total: 0,
      average: 0,
      highest: 0,
      lowest: 0,
      passRate: 0,
    };
  }

  const total = scores.length;
  const sum = scores.reduce((a, b) => a + b, 0);

  return {
    total,
    average: Math.round(sum / total),
    highest: Math.max(...scores),
    lowest: Math.min(...scores),
    passRate: Math.round(
      (scores.filter((score) => score >= passingScore).length / total) * 100
    ),
  };
}
