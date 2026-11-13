/**
 * PROOF — Trust and Fraud Detection Engine
 * ----------------------------------------
 * Deterministic risk assessment for candidate and company activity.
 *
 * IMPORTANT:
 * This module produces risk signals for review.
 * It does not make irreversible account-ban decisions.
 */

export type TrustEntityType = "candidate" | "company";

export type RiskSeverity =
  | "low"
  | "moderate"
  | "high"
  | "critical";

export interface TrustAssessmentInput {
  entityId: string;
  entityType: TrustEntityType;

  accountAgeDays: number;
  emailVerified: boolean;

  reportedCount?: number;
  suspiciousLinkCount?: number;
  duplicateContentCount?: number;

  profileCompleteness?: number;
  identityVerified?: boolean;
  domainVerified?: boolean;

  failedLoginCount?: number;
  unusualActivityCount?: number;
}

export interface RiskSignal {
  code: string;
  description: string;
  points: number;
}

export interface TrustAssessmentResult {
  entityId: string;
  entityType: TrustEntityType;

  riskScore: number;
  trustScore: number;

  severity: RiskSeverity;
  requiresReview: boolean;

  signals: RiskSignal[];
  recommendations: string[];

  assessedAt: string;
}

const MAX_SCORE = 100;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function assertCount(name: string, value: number): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${name} must be a non-negative integer.`);
  }
}

function addSignal(
  signals: RiskSignal[],
  code: string,
  description: string,
  points: number,
): void {
  if (points <= 0) return;

  signals.push({
    code,
    description,
    points,
  });
}

function classifyRisk(score: number): RiskSeverity {
  if (score >= 80) return "critical";
  if (score >= 60) return "high";
  if (score >= 30) return "moderate";
  return "low";
}

function buildRecommendations(
  severity: RiskSeverity,
  signals: RiskSignal[],
): string[] {
  const recommendations: string[] = [];

  if (signals.some((signal) => signal.code === "EMAIL_UNVERIFIED")) {
    recommendations.push("Request email verification.");
  }

  if (signals.some((signal) => signal.code === "IDENTITY_UNVERIFIED")) {
    recommendations.push("Request identity verification where appropriate.");
  }

  if (signals.some((signal) => signal.code === "REPORTS_RECEIVED")) {
    recommendations.push("Review submitted reports and supporting evidence.");
  }

  if (signals.some((signal) => signal.code === "SUSPICIOUS_LINKS")) {
    recommendations.push("Manually inspect suspicious external links.");
  }

  if (signals.some((signal) => signal.code === "DUPLICATE_CONTENT")) {
    recommendations.push("Review repeated content for spam or duplication.");
  }

  if (severity === "high" || severity === "critical") {
    recommendations.push("Send this account for human trust-team review.");
  }

  if (recommendations.length === 0) {
    recommendations.push("Continue routine monitoring.");
  }

  return recommendations;
}

/**
 * Calculate risk from explicit, measurable signals.
 *
 * Higher score = higher risk.
 * Trust score is the inverse of risk score.
 */
export function assessTrust(
  input: TrustAssessmentInput,
): TrustAssessmentResult {
  if (!input.entityId.trim()) {
    throw new Error("Entity ID is required.");
  }

  if (!["candidate", "company"].includes(input.entityType)) {
    throw new Error("Unsupported entity type.");
  }

  assertCount("accountAgeDays", input.accountAgeDays);

  const counts = [
    ["reportedCount", input.reportedCount ?? 0],
    ["suspiciousLinkCount", input.suspiciousLinkCount ?? 0],
    ["duplicateContentCount", input.duplicateContentCount ?? 0],
    ["failedLoginCount", input.failedLoginCount ?? 0],
    ["unusualActivityCount", input.unusualActivityCount ?? 0],
  ] as const;

  for (const [name, value] of counts) {
    assertCount(name, value);
  }

  if (
    input.profileCompleteness !== undefined &&
    (!Number.isFinite(input.profileCompleteness) ||
      input.profileCompleteness < 0 ||
      input.profileCompleteness > 100)
  ) {
    throw new Error("Profile completeness must be between 0 and 100.");
  }

  const signals: RiskSignal[] = [];

  if (!input.emailVerified) {
    addSignal(
      signals,
      "EMAIL_UNVERIFIED",
      "Email address has not been verified.",
      15,
    );
  }

  if (input.accountAgeDays < 3) {
    addSignal(
      signals,
      "NEW_ACCOUNT",
      "Account was created very recently.",
      15,
    );
  } else if (input.accountAgeDays < 14) {
    addSignal(
      signals,
      "RECENT_ACCOUNT",
      "Account has limited history.",
      7,
    );
  }

  const reports = input.reportedCount ?? 0;

  if (reports > 0) {
    addSignal(
      signals,
      "REPORTS_RECEIVED",
      "This account has received user reports.",
      Math.min(30, reports * 10),
    );
  }

  const links = input.suspiciousLinkCount ?? 0;

  if (links > 0) {
    addSignal(
      signals,
      "SUSPICIOUS_LINKS",
      "Potentially suspicious external links were detected.",
      Math.min(25, links * 10),
    );
  }

  const duplicates = input.duplicateContentCount ?? 0;

  if (duplicates > 0) {
    addSignal(
      signals,
      "DUPLICATE_CONTENT",
      "Repeated content patterns were detected.",
      Math.min(20, duplicates * 5),
    );
  }

  const failedLogins = input.failedLoginCount ?? 0;

  if (failedLogins >= 10) {
    addSignal(
      signals,
      "LOGIN_ANOMALY",
      "Unusually high number of failed login attempts.",
      20,
    );
  } else if (failedLogins >= 5) {
    addSignal(
      signals,
      "LOGIN_ANOMALY",
      "Multiple failed login attempts detected.",
      10,
    );
  }

  const unusualActivity = input.unusualActivityCount ?? 0;

  if (unusualActivity > 0) {
    addSignal(
      signals,
      "UNUSUAL_ACTIVITY",
      "Unusual activity requires further review.",
      Math.min(20, unusualActivity * 5),
    );
  }

  if (input.identityVerified === false) {
    addSignal(
      signals,
      "IDENTITY_UNVERIFIED",
      "Identity verification has not been completed.",
      8,
    );
  }

  if (input.entityType === "company" && input.domainVerified === false) {
    addSignal(
      signals,
      "DOMAIN_UNVERIFIED",
      "Company domain verification is incomplete.",
      12,
    );
  }

  if (
    input.profileCompleteness !== undefined &&
    input.profileCompleteness < 30
  ) {
    addSignal(
      signals,
      "INCOMPLETE_PROFILE",
      "Profile contains limited information.",
      5,
    );
  }

  const rawRisk = signals.reduce(
    (total, signal) => total + signal.points,
    0,
  );

  const riskScore = clamp(rawRisk, 0, MAX_SCORE);
  const trustScore = MAX_SCORE - riskScore;
  const severity = classifyRisk(riskScore);

  return {
    entityId: input.entityId,
    entityType: input.entityType,
    riskScore,
    trustScore,
    severity,
    requiresReview: severity === "high" || severity === "critical",
    signals,
    recommendations: buildRecommendations(severity, signals),
    assessedAt: new Date().toISOString(),
  };
}

/**
 * Compare two normalized text values.
 *
 * This intentionally uses exact normalized matching,
 * not an AI-generated similarity claim.
 */
export function isDuplicateContent(
  first: string,
  second: string,
): boolean {
  const normalize = (value: string) =>
    value
      .normalize("NFKC")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");

  if (!first.trim() || !second.trim()) {
    return false;
  }

  return normalize(first) === normalize(second);
}

/**
 * Determine whether a trust result should enter manual review.
 */
export function shouldEscalateTrustReview(
  result: TrustAssessmentResult,
): boolean {
  return (
    result.requiresReview ||
    result.severity === "critical"
  );
}
