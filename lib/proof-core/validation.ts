import type {
  Candidate,
  Opportunity,
  SkillRequirement,
  ChallengeAttempt,
} from "./types";

export interface ValidationIssue {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}

function result(issues: ValidationIssue[]): ValidationResult {
  return { valid: issues.length === 0, issues };
}

export function isNonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function isValidScore(value: unknown): value is number {
  return typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= 100;
}

export function validateCandidate(candidate: Candidate): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (!isNonEmpty(candidate.id)) {
    issues.push({ field: "id", message: "Candidate ID is required." });
  }

  if (!isNonEmpty(candidate.name)) {
    issues.push({ field: "name", message: "Candidate name is required." });
  }

  if (!Array.isArray(candidate.skills)) {
    issues.push({ field: "skills", message: "Skills must be an array." });
  } else {
    candidate.skills.forEach((skill, index) => {
      if (!isNonEmpty(skill.skill)) {
        issues.push({
          field: `skills.${index}.skill`,
          message: "Skill name is required.",
        });
      }

      if (!isValidScore(skill.score)) {
        issues.push({
          field: `skills.${index}.score`,
          message: "Skill score must be between 0 and 100.",
        });
      }
    });
  }

  if (
    candidate.experienceYears !== undefined &&
    (!Number.isFinite(candidate.experienceYears) ||
      candidate.experienceYears < 0)
  ) {
    issues.push({
      field: "experienceYears",
      message: "Experience cannot be negative.",
    });
  }

  return result(issues);
}

export function validateRequirement(
  requirement: SkillRequirement,
): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (!isNonEmpty(requirement.skill)) {
    issues.push({ field: "skill", message: "Skill is required." });
  }

  if (!isValidScore(requirement.minimumScore)) {
    issues.push({
      field: "minimumScore",
      message: "Minimum score must be between 0 and 100.",
    });
  }

  if (
    !Number.isFinite(requirement.weight) ||
    requirement.weight <= 0
  ) {
    issues.push({
      field: "weight",
      message: "Weight must be greater than zero.",
    });
  }

  return result(issues);
}

export function validateOpportunity(
  opportunity: Opportunity,
): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (!isNonEmpty(opportunity.id)) {
    issues.push({ field: "id", message: "Opportunity ID is required." });
  }

  if (!isNonEmpty(opportunity.title)) {
    issues.push({ field: "title", message: "Title is required." });
  }

  if (!isNonEmpty(opportunity.companyId)) {
    issues.push({ field: "companyId", message: "Company ID is required." });
  }

  if (!Array.isArray(opportunity.requirements)) {
    issues.push({
      field: "requirements",
      message: "Requirements must be an array.",
    });
  } else {
    opportunity.requirements.forEach((requirement, index) => {
      const checked = validateRequirement(requirement);
      checked.issues.forEach((issue) => {
        issues.push({
          field: `requirements.${index}.${issue.field}`,
          message: issue.message,
        });
      });
    });
  }

  return result(issues);
}

export function validateAttempt(
  attempt: ChallengeAttempt,
): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (!isNonEmpty(attempt.candidateId)) {
    issues.push({
      field: "candidateId",
      message: "Candidate ID is required.",
    });
  }

  if (!isNonEmpty(attempt.challengeId)) {
    issues.push({
      field: "challengeId",
      message: "Challenge ID is required.",
    });
  }

  if (
    !Number.isFinite(attempt.score) ||
    !Number.isFinite(attempt.maxScore) ||
    attempt.maxScore <= 0 ||
    attempt.score < 0 ||
    attempt.score > attempt.maxScore
  ) {
    issues.push({
      field: "score",
      message: "Attempt score must be within the maximum score.",
    });
  }

  if (
    !Number.isFinite(attempt.durationSeconds) ||
    attempt.durationSeconds < 0
  ) {
    issues.push({
      field: "durationSeconds",
      message: "Duration cannot be negative.",
    });
  }

  return result(issues);
}
