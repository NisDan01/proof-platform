import type {
  EvaluationDimension,
  EvaluationResult,
  SkillScore,
} from "./types";

export function clampScore(score: number): number {
  if (!Number.isFinite(score)) return 0;
  return Math.min(100, Math.max(0, score));
}

export function percentage(score: number, maximum: number): number {
  if (!Number.isFinite(score) || !Number.isFinite(maximum) || maximum <= 0) {
    return 0;
  }

  return clampScore((score / maximum) * 100);
}

export function gradeForScore(score: number): string {
  const value = clampScore(score);

  if (value >= 95) return "A+";
  if (value >= 90) return "A";
  if (value >= 80) return "B";
  if (value >= 70) return "C";
  if (value >= 60) return "D";
  return "Needs improvement";
}

export function calculateWeightedScore(
  dimensions: EvaluationDimension[],
): number {
  if (dimensions.length === 0) return 0;

  let weightedTotal = 0;
  let totalWeight = 0;

  for (const dimension of dimensions) {
    if (
      !Number.isFinite(dimension.score) ||
      !Number.isFinite(dimension.weight) ||
      dimension.weight <= 0
    ) {
      continue;
    }

    weightedTotal += clampScore(dimension.score) * dimension.weight;
    totalWeight += dimension.weight;
  }

  return totalWeight === 0
    ? 0
    : Math.round(weightedTotal / totalWeight);
}

export function evaluateDimensions(
  dimensions: EvaluationDimension[],
  passingScore = 70,
): EvaluationResult {
  const score = calculateWeightedScore(dimensions);
  const feedback = dimensions
    .filter((dimension) => dimension.feedback?.trim())
    .map((dimension) => `${dimension.name}: ${dimension.feedback}`);

  const weakDimensions = dimensions.filter(
    (dimension) => dimension.score < passingScore,
  );

  for (const dimension of weakDimensions) {
    feedback.push(`Improve ${dimension.name} to reach the passing threshold.`);
  }

  return {
    score,
    grade: gradeForScore(score),
    passed: score >= passingScore,
    dimensions,
    feedback,
  };
}

export function normalizeSkillScores(
  skills: SkillScore[],
): SkillScore[] {
  return skills.map((skill) => ({
    ...skill,
    score: clampScore(skill.score),
  }));
}

export function calculateSkillAverage(skills: SkillScore[]): number {
  if (skills.length === 0) return 0;

  const total = skills.reduce(
    (sum, skill) => sum + clampScore(skill.score),
    0,
  );

  return Math.round(total / skills.length);
}

export function skillLevel(score: number): string {
  const value = clampScore(score);

  if (value >= 90) return "Expert";
  if (value >= 75) return "Advanced";
  if (value >= 50) return "Intermediate";
  return "Beginner";
}

export function scoreImprovement(
  previousScore: number,
  currentScore: number,
): number {
  return Math.round(
    (clampScore(currentScore) - clampScore(previousScore)) * 100,
  ) / 100;
}
