import type {
  EvaluationResult,
  EvaluationDimension,
  EvaluationGrade,
} from "./types";

export interface AnalyticsFilters {
  candidateId?: string;
  grade?: EvaluationGrade;
  passed?: boolean;
  from?: string;
  to?: string;
  search?: string;
}

export interface GradeDistribution {
  grade: EvaluationGrade;
  count: number;
  percentage: number;
}

export interface DimensionPerformance {
  dimension: EvaluationDimension;
  averageScore: number;
  maximumScore: number;
  minimumScore: number;
  evaluations: number;
}

export interface DailyPerformance {
  date: string;
  evaluations: number;
  averageScore: number;
  passCount: number;
}

export interface CandidateAnalytics {
  totalEvaluations: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  passedEvaluations: number;
  failedEvaluations: number;
  passRate: number;
  latestScore: number | null;
  improvement: number;
  gradeDistribution: GradeDistribution[];
  dimensions: DimensionPerformance[];
  trend: DailyPerformance[];
}

const GRADES: EvaluationGrade[] = [
  "excellent",
  "good",
  "average",
  "needs_improvement",
];

const DIMENSIONS: EvaluationDimension[] = [
  "accuracy",
  "relevance",
  "clarity",
  "reasoning",
  "instruction_following",
];

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function validDate(value: string): number {
  const result = Date.parse(value);
  return Number.isFinite(result) ? result : 0;
}

export function filterEvaluations(
  records: EvaluationResult[],
  filters: AnalyticsFilters = {}
): EvaluationResult[] {
  return records
    .filter((record) => {
      if (
        filters.candidateId &&
        record.candidateId !== filters.candidateId
      ) return false;

      if (filters.grade && record.grade !== filters.grade) {
        return false;
      }

      if (
        filters.passed !== undefined &&
        record.passed !== filters.passed
      ) return false;

      const timestamp = validDate(record.evaluatedAt);

      if (filters.from) {
        const start = validDate(filters.from);
        if (!start || timestamp < start) return false;
      }

      if (filters.to) {
        const end = validDate(filters.to);
        if (!end || timestamp > end) return false;
      }

      if (filters.search) {
        const query = filters.search.toLowerCase();
        const searchable = [
          record.challengeId,
          record.candidateId,
          record.summary,
          ...record.strengths,
          ...record.improvements,
        ].join(" ").toLowerCase();

        if (!searchable.includes(query)) return false;
      }

      return true;
    })
    .sort(
      (a, b) =>
        validDate(b.evaluatedAt) - validDate(a.evaluatedAt)
    );
}

export function getGradeDistribution(
  records: EvaluationResult[]
): GradeDistribution[] {
  const total = records.length;

  return GRADES.map((grade) => {
    const count = records.filter(
      (record) => record.grade === grade
    ).length;

    return {
      grade,
      count,
      percentage: total ? round((count / total) * 100) : 0,
    };
  });
}

export function getDimensionPerformance(
  records: EvaluationResult[]
): DimensionPerformance[] {
  return DIMENSIONS.map((dimension) => {
    const scores = records.flatMap((record) =>
      record.dimensions
        .filter((item) => item.dimension === dimension)
        .map((item) => item.score)
    );

    if (!scores.length) {
      return {
        dimension,
        averageScore: 0,
        maximumScore: 0,
        minimumScore: 0,
        evaluations: 0,
      };
    }

    const total = scores.reduce((sum, score) => sum + score, 0);

    return {
      dimension,
      averageScore: round(total / scores.length),
      maximumScore: Math.max(...scores),
      minimumScore: Math.min(...scores),
      evaluations: scores.length,
    };
  });
}

export function getDailyPerformance(
  records: EvaluationResult[]
): DailyPerformance[] {
  const buckets = new Map<string, EvaluationResult[]>();

  for (const record of records) {
    const timestamp = validDate(record.evaluatedAt);
    if (!timestamp) continue;

    const date = new Date(timestamp).toISOString().slice(0, 10);
    const bucket = buckets.get(date) ?? [];

    bucket.push(record);
    buckets.set(date, bucket);
  }

  return Array.from(buckets.entries())
    .map(([date, items]) => {
      const total = items.reduce(
        (sum, item) => sum + item.score,
        0
      );

      return {
        date,
        evaluations: items.length,
        averageScore: round(total / items.length),
        passCount: items.filter((item) => item.passed).length,
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function calculateCandidateAnalytics(
  records: EvaluationResult[]
): CandidateAnalytics {
  const ordered = [...records].sort(
    (a, b) =>
      validDate(a.evaluatedAt) - validDate(b.evaluatedAt)
  );

  const total = ordered.length;
  const scores = ordered.map((item) => item.score);

  const passed = ordered.filter((item) => item.passed).length;
  const average = total
    ? scores.reduce((sum, score) => sum + score, 0) / total
    : 0;

  const firstScore = scores[0] ?? 0;
  const lastScore = scores[scores.length - 1] ?? 0;

  return {
    totalEvaluations: total,
    averageScore: round(average),
    highestScore: total ? Math.max(...scores) : 0,
    lowestScore: total ? Math.min(...scores) : 0,
    passedEvaluations: passed,
    failedEvaluations: total - passed,
    passRate: total ? round((passed / total) * 100) : 0,
    latestScore: total ? lastScore : null,
    improvement: total > 1 ? round(lastScore - firstScore) : 0,
    gradeDistribution: getGradeDistribution(ordered),
    dimensions: getDimensionPerformance(ordered),
    trend: getDailyPerformance(ordered),
  };
}

export function getStrongestDimension(
  records: EvaluationResult[]
): EvaluationDimension | null {
  const dimensions = getDimensionPerformance(records)
    .filter((item) => item.evaluations > 0)
    .sort((a, b) => b.averageScore - a.averageScore);

  return dimensions[0]?.dimension ?? null;
}

export function getWeakestDimension(
  records: EvaluationResult[]
): EvaluationDimension | null {
  const dimensions = getDimensionPerformance(records)
    .filter((item) => item.evaluations > 0)
    .sort((a, b) => a.averageScore - b.averageScore);

  return dimensions[0]?.dimension ?? null;
}

export function getEvaluationHistory(
  records: EvaluationResult[],
  limit = 20,
  offset = 0
): EvaluationResult[] {
  if (!Number.isInteger(limit) || limit < 1) {
    throw new Error("Limit must be a positive integer.");
  }

  if (!Number.isInteger(offset) || offset < 0) {
    throw new Error("Offset must be a non-negative integer.");
  }

  return [...records]
    .sort(
      (a, b) =>
        validDate(b.evaluatedAt) - validDate(a.evaluatedAt)
    )
    .slice(offset, offset + limit);
}
