export type VerificationStatus =
  | "verified"
  | "pending"
  | "expired"
  | "rejected";

export interface SkillEvidenceRecord {
  candidateId: string;
  skillName: string;
  score: number;
  issuer: string;
  issuerTrusted: boolean;
  issuedAt: string;
  expiresAt?: string;
  evidenceReference?: string;
  rejected?: boolean;
}

export interface SkillVerificationResult {
  candidateId: string;
  skillName: string;
  status: VerificationStatus;
  isVerified: boolean;
  reasons: string[];
  checkedAt: string;
}

export interface VerificationPolicy {
  requireTrustedIssuer: boolean;
  maximumEvidenceAgeDays?: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function evaluateSkillEvidence(
  evidence: SkillEvidenceRecord,
  policy: VerificationPolicy = {
    requireTrustedIssuer: true,
  },
  now: Date = new Date(),
): SkillVerificationResult {
  if (!evidence.candidateId.trim()) {
    throw new Error("Candidate ID is required.");
  }

  if (!evidence.skillName.trim()) {
    throw new Error("Skill name is required.");
  }

  if (
    !Number.isFinite(evidence.score) ||
    evidence.score < 0 ||
    evidence.score > 100
  ) {
    throw new Error("Evidence score must be between 0 and 100.");
  }

  if (Number.isNaN(now.getTime())) {
    throw new Error("Verification date is invalid.");
  }

  const issuedAt = new Date(evidence.issuedAt);
  const expiresAt = evidence.expiresAt
    ? new Date(evidence.expiresAt)
    : undefined;

  if (Number.isNaN(issuedAt.getTime())) {
    throw new Error("Evidence issue date is invalid.");
  }

  if (expiresAt && Number.isNaN(expiresAt.getTime())) {
    throw new Error("Evidence expiry date is invalid.");
  }

  if (issuedAt.getTime() > now.getTime()) {
    throw new Error("Evidence cannot be issued in the future.");
  }

  const reasons: string[] = [];
  let status: VerificationStatus = "verified";

  if (evidence.rejected) {
    status = "rejected";
    reasons.push("Evidence has been rejected by a reviewer.");
  } else if (expiresAt && expiresAt.getTime() <= now.getTime()) {
    status = "expired";
    reasons.push("Evidence has passed its expiry date.");
  } else if (
    policy.requireTrustedIssuer &&
    !evidence.issuerTrusted
  ) {
    status = "pending";
    reasons.push("Evidence issuer has not been trusted.");
  } else if (!evidence.issuer.trim()) {
    status = "pending";
    reasons.push("Evidence issuer is missing.");
  } else if (
    policy.maximumEvidenceAgeDays !== undefined &&
    (
      !Number.isFinite(policy.maximumEvidenceAgeDays) ||
      policy.maximumEvidenceAgeDays < 0
    )
  ) {
    throw new Error("Maximum evidence age policy is invalid.");
  } else if (
    policy.maximumEvidenceAgeDays !== undefined &&
    now.getTime() - issuedAt.getTime() >
      policy.maximumEvidenceAgeDays * DAY_MS
  ) {
    status = "expired";
    reasons.push("Evidence is older than the allowed policy.");
  } else {
    reasons.push("Evidence passed the configured checks.");
  }

  return {
    candidateId: evidence.candidateId,
    skillName: evidence.skillName,
    status,
    isVerified: status === "verified",
    reasons,
    checkedAt: now.toISOString(),
  };
}
