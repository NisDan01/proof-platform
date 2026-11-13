/**
 * PROOF Quality & Reliability Engine
 * Deterministic utilities for scoring, validation,
 * pagination, search and safe data exports.
 */

export type QualitySeverity = "low" | "medium" | "high";

export interface QualityIssue {
  field: string;
  message: string;
  severity: QualitySeverity;
}

export interface QualityResult<T> {
  success: boolean;
  data: T | null;
  issues: QualityIssue[];
}

export interface QualityPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  offset: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export interface QualityScoreInput {
  score: number;
  weight: number;
}

export interface QualityScoreResult {
  score: number;
  band: string;
  passed: boolean;
}

const MAX_TEXT_LENGTH = 2000;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function finiteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function qualityNormalizeText(
  value: unknown,
  maxLength = MAX_TEXT_LENGTH,
): string {
  if (typeof value !== "string") return "";

  const safeLimit = clamp(
    Number.isFinite(maxLength) ? Math.floor(maxLength) : MAX_TEXT_LENGTH,
    0,
    MAX_TEXT_LENGTH,
  );

  return value
    .normalize("NFKC")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim()
    .slice(0, safeLimit);
}

export function qualityNormalizeSearchQuery(
  value: unknown,
  maxLength = 120,
): string {
  return qualityNormalizeText(value, maxLength)
    .replace(/\s+/g, " ")
    .trim();
}

export function qualityValidateScore(
  score: unknown,
): QualityResult<number> {
  const issues: QualityIssue[] = [];

  if (!finiteNumber(score)) {
    issues.push({
      field: "score",
      message: "Score must be a finite number.",
      severity: "high",
    });
  } else if (score < 0 || score > 100) {
    issues.push({
      field: "score",
      message: "Score must be between 0 and 100.",
      severity: "high",
    });
  }

  return {
    success: issues.length === 0,
    data: issues.length === 0 ? score as number : null,
    issues,
  };
}

export function qualityGetScoreBand(score: number): string {
  const validation = qualityValidateScore(score);

  if (!validation.success) {
    throw new RangeError("Score must be between 0 and 100.");
  }

  if (score >= 90) return "Excellent";
  if (score >= 80) return "Strong";
  if (score >= 70) return "Developing";
  if (score >= 50) return "Needs improvement";
  return "Beginner";
}

export function qualityCalculateWeightedScore(
  inputs: QualityScoreInput[],
): number {
  if (!Array.isArray(inputs) || inputs.length === 0) {
    throw new Error("At least one scoring input is required.");
  }

  let weightedTotal = 0;
  let totalWeight = 0;

  for (const input of inputs) {
    if (!finiteNumber(input.score) || input.score < 0 || input.score > 100) {
      throw new RangeError("Every score must be between 0 and 100.");
    }

    if (!finiteNumber(input.weight) || input.weight <= 0) {
      throw new RangeError("Every weight must be greater than zero.");
    }

    weightedTotal += input.score * input.weight;
    totalWeight += input.weight;
  }

  return Math.round((weightedTotal / totalWeight) * 100) / 100;
}

export function qualityBuildPagination(
  total: number,
  requestedPage = 1,
  requestedPageSize = DEFAULT_PAGE_SIZE,
): QualityPagination {
  const safeTotal = finiteNumber(total)
    ? Math.max(0, Math.floor(total))
    : 0;

  const pageSize = clamp(
    finiteNumber(requestedPageSize)
      ? Math.floor(requestedPageSize)
      : DEFAULT_PAGE_SIZE,
    1,
    MAX_PAGE_SIZE,
  );

  const totalPages = Math.ceil(safeTotal / pageSize);

  const page = clamp(
    finiteNumber(requestedPage) ? Math.floor(requestedPage) : 1,
    1,
    Math.max(1, totalPages),
  );

  return {
    page,
    pageSize,
    total: safeTotal,
    totalPages,
    offset: (page - 1) * pageSize,
    hasPrevious: page > 1,
    hasNext: page < totalPages,
  };
}

export function qualityEscapeCsvCell(value: unknown): string {
  let text = String(value ?? "");

  // Protect spreadsheet applications from formula injection.
  if (/^[\s]*[=+\-@]/.test(text)) {
    text = `'${text}`;
  }

  return `"${text.replace(/"/g, '""')}"`;
}

export function qualityBuildCsv(
  headers: string[],
  rows: unknown[][],
): string {
  if (!Array.isArray(headers) || !Array.isArray(rows)) {
    throw new TypeError("CSV headers and rows must be arrays.");
  }

  const safeHeaders = headers.map(qualityEscapeCsvCell);

  const safeRows = rows.map((row) => {
    if (!Array.isArray(row)) {
      throw new TypeError("Every CSV row must be an array.");
    }

    return row.map(qualityEscapeCsvCell);
  });

  return [safeHeaders, ...safeRows]
    .map((row) => row.join(","))
    .join("\r\n");
}

export function qualitySummarizeIssues(
  issues: QualityIssue[],
): Record<QualitySeverity, number> {
  const summary: Record<QualitySeverity, number> = {
    low: 0,
    medium: 0,
    high: 0,
  };

  for (const issue of issues) {
    if (issue.severity in summary) {
      summary[issue.severity] += 1;
    }
  }

  return summary;
}

export function qualityCompareScores(
  first: number,
  second: number,
): number {
  if (!qualityValidateScore(first).success ||
      !qualityValidateScore(second).success) {
    throw new RangeError("Both scores must be between 0 and 100.");
  }

  return Math.round((first - second) * 100) / 100;
}

export function qualityCreateResult<T>(
  data: T | null,
  issues: QualityIssue[] = [],
): QualityResult<T> {
  return {
    success: issues.length === 0 && data !== null,
    data: issues.length === 0 ? data : null,
    issues: [...issues],
  };
}

export function qualityCreateRecordKey(
  namespace: string,
  identifier: string,
): string {
  const safeNamespace = qualityNormalizeText(namespace, 80)
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-");

  const safeIdentifier = qualityNormalizeText(identifier, 120)
    .replace(/[^a-zA-Z0-9-]/g, "-");

  if (!safeNamespace || !safeIdentifier) {
    throw new Error("Namespace and identifier are required.");
  }

  return `${safeNamespace}:${safeIdentifier}`;
}

export function qualityCalculatePassRate(
  passed: number,
  total: number,
): number {
  if (!Number.isInteger(passed) ||
      !Number.isInteger(total) ||
      passed < 0 ||
      total < 0 ||
      passed > total) {
    throw new RangeError("Invalid pass rate inputs.");
  }

  if (total === 0) return 0;

  return Math.round((passed / total) * 10000) / 100;
}

export function qualityBuildScoreResult(
  score: number,
  passingScore = 70,
): QualityScoreResult {
  if (!qualityValidateScore(score).success ||
      !qualityValidateScore(passingScore).success) {
    throw new RangeError("Score thresholds must be between 0 and 100.");
  }

  return {
    score,
    band: qualityGetScoreBand(score),
    passed: score >= passingScore,
  };
}
