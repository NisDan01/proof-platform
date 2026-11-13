import type { ChallengeAttempt } from "./types";

export interface PerformanceSummary {
  totalAttempts: number;
  averageScore: number;
  bestScore: number;
  completionTimeAverage: number;
  passRate: number;
  uniqueChallenges: number;
}

export interface SkillPerformance {
  skill: string;
  attempts: number;
  averageScore: number;
  bestScore: number;
  latestScore: number;
}

export function summarizePerformance(
  attempts: ChallengeAttempt[],
  passingScore = 70,
): PerformanceSummary {
  if (attempts.length === 0) {
    return {
      totalAttempts: 0,
      averageScore: 0,
      bestScore: 0,
      completionTimeAverage: 0,
      passRate: 0,
      uniqueChallenges: 0,
    };
  }

  const scores = attempts.map((attempt) =>
    attempt.maxScore > 0
      ? (attempt.score / attempt.maxScore) * 100
      : 0,
  );

  const passed = scores.filter((score) => score >= passingScore).length;

  return {
    totalAttempts: attempts.length,
    averageScore: Math.round(
      scores.reduce((sum, score) => sum + score, 0) / scores.length,
    ),
    bestScore: Math.round(Math.max(...scores)),
    completionTimeAverage: Math.round(
      attempts.reduce(
        (sum, attempt) => sum + attempt.durationSeconds,
        0,
      ) / attempts.length,
    ),
    passRate: Math.round((passed / attempts.length) * 100),
    uniqueChallenges: new Set(
      attempts.map((attempt) => attempt.challengeId),
    ).size,
  };
}

export function performanceBySkill(
  attempts: ChallengeAttempt[],
): SkillPerformance[] {
  const groups = new Map<string, ChallengeAttempt[]>();

  for (const attempt of attempts) {
    const current = groups.get(attempt.skill) ?? [];
    current.push(attempt);
    groups.set(attempt.skill, current);
  }

  return Array.from(groups.entries()).map(([skill, entries]) => {
    const scores = entries.map((entry) =>
      entry.maxScore > 0 ? (entry.score / entry.maxScore) * 100 : 0,
    );

    const latest = [...entries].sort(
      (a, b) =>
        new Date(b.completedAt).getTime() -
        new Date(a.completedAt).getTime(),
    )[0];

    return {
      skill,
      attempts: entries.length,
      averageScore: Math.round(
        scores.reduce((sum, score) => sum + score, 0) / scores.length,
      ),
      bestScore: Math.round(Math.max(...scores)),
      latestScore: Math.round(
        latest.maxScore > 0
          ? (latest.score / latest.maxScore) * 100
          : 0,
      ),
    };
  }).sort((a, b) => b.averageScore - a.averageScore);
}

export function scoreTrend(
  attempts: ChallengeAttempt[],
): Array<{ date: string; score: number }> {
  return [...attempts]
    .sort(
      (a, b) =>
        new Date(a.completedAt).getTime() -
        new Date(b.completedAt).getTime(),
    )
    .map((attempt) => ({
      date: attempt.completedAt,
      score: Math.round(
        attempt.maxScore > 0
          ? (attempt.score / attempt.maxScore) * 100
          : 0,
      ),
    }));
}

export function compareAttempts(
  first: ChallengeAttempt,
  second: ChallengeAttempt,
): {
  scoreDifference: number;
  timeDifference: number;
  improved: boolean;
} {
  const firstScore = first.maxScore > 0
    ? (first.score / first.maxScore) * 100
    : 0;

  const secondScore = second.maxScore > 0
    ? (second.score / second.maxScore) * 100
    : 0;

  return {
    scoreDifference: Math.round((secondScore - firstScore) * 100) / 100,
    timeDifference: second.durationSeconds - first.durationSeconds,
    improved: secondScore > firstScore,
  };
}
