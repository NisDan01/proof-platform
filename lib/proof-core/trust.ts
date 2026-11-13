export type TrustSignal =
  | "verified_email"
  | "verified_company"
  | "verified_skill"
  | "complete_profile"
  | "suspicious_activity"
  | "reported_company"
  | "duplicate_application"
  | "inconsistent_identity";

export interface TrustEvidence {
  signal: TrustSignal;
  weight: number;
  detail: string;
  observedAt: string;
}

export interface TrustAssessment {
  score: number;
  level: "trusted" | "review" | "high_risk";
  positiveSignals: number;
  negativeSignals: number;
  reasons: string[];
}

const DEFAULT_WEIGHTS: Record<TrustSignal, number> = {
  verified_email: 10,
  verified_company: 25,
  verified_skill: 15,
  complete_profile: 10,
  suspicious_activity: -25,
  reported_company: -35,
  duplicate_application: -15,
  inconsistent_identity: -30,
};

export function assessTrust(
  evidence: TrustEvidence[],
): TrustAssessment {
  let score = 50;
  const reasons: string[] = [];
  let positiveSignals = 0;
  let negativeSignals = 0;

  for (const item of evidence) {
    const weight = Math.max(
      -50,
      Math.min(50, item.weight || DEFAULT_WEIGHTS[item.signal]),
    );

    score += weight;
    reasons.push(item.detail);

    if (weight >= 0) positiveSignals++;
    else negativeSignals++;
  }

  score = Math.max(0, Math.min(100, score));

  return {
    score,
    level: score >= 75 ? "trusted" : score >= 40 ? "review" : "high_risk",
    positiveSignals,
    negativeSignals,
    reasons,
  };
}

export function isValidTrustEvidence(item: TrustEvidence): boolean {
  return Boolean(
    item.signal &&
    item.detail.trim().length > 0 &&
    !Number.isNaN(Date.parse(item.observedAt)) &&
    Number.isFinite(item.weight),
  );
}

export function shouldRequireManualReview(
  assessment: TrustAssessment,
): boolean {
  return assessment.level !== "trusted" ||
    assessment.negativeSignals >= 2;
}

export function summarizeTrust(
  assessment: TrustAssessment,
): string {
  return `${assessment.level.toUpperCase()} (${assessment.score}/100): ${assessment.reasons.join("; ")}`;
}
