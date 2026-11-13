/**
 * PROOF Assessment & Certification Engine
 * Deterministic assessment validation, scoring and certification rules.
 */

export type AssessmentDifficulty = "beginner" | "intermediate" | "advanced";

export interface AssessmentOption {
  id: string;
  text: string;
}

export interface AssessmentQuestion {
  id: string;
  skill: string;
  prompt: string;
  options: AssessmentOption[];
  correctOptionId: string;
  weight: number;
  difficulty: AssessmentDifficulty;
}

export interface AssessmentDefinition {
  id: string;
  title: string;
  durationSeconds: number;
  passingScore: number;
  questions: AssessmentQuestion[];
}

export interface AssessmentAnswer {
  questionId: string;
  selectedOptionId: string;
  responseTimeMs?: number;
}

export interface AssessmentAttempt {
  assessmentId: string;
  answers: AssessmentAnswer[];
  durationSeconds: number;
  tabSwitches?: number;
  submittedAt?: string;
}

export interface AssessmentIssue {
  field: string;
  message: string;
}

export interface SkillScore {
  skill: string;
  earnedWeight: number;
  totalWeight: number;
  score: number;
}

export interface AssessmentResult {
  assessmentId: string;
  score: number;
  passed: boolean;
  correctAnswers: number;
  totalQuestions: number;
  durationSeconds: number;
  skillScores: SkillScore[];
  reviewRequired: boolean;
  reviewReasons: string[];
  completedAt: string;
}

export interface CertificationPolicy {
  minimumScore: number;
  maximumTabSwitches: number;
  minimumDurationSeconds: number;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const isNonEmpty = (value: string) =>
  typeof value === "string" && value.trim().length > 0;

export function validateAssessment(
  assessment: AssessmentDefinition,
): AssessmentIssue[] {
  const issues: AssessmentIssue[] = [];

  if (!isNonEmpty(assessment.id)) {
    issues.push({ field: "id", message: "Assessment ID is required." });
  }

  if (!isNonEmpty(assessment.title)) {
    issues.push({ field: "title", message: "Assessment title is required." });
  }

  if (
    !Number.isFinite(assessment.durationSeconds) ||
    assessment.durationSeconds <= 0
  ) {
    issues.push({
      field: "durationSeconds",
      message: "Duration must be a positive number.",
    });
  }

  if (
    !Number.isFinite(assessment.passingScore) ||
    assessment.passingScore < 0 ||
    assessment.passingScore > 100
  ) {
    issues.push({
      field: "passingScore",
      message: "Passing score must be between 0 and 100.",
    });
  }

  if (!assessment.questions.length) {
    issues.push({
      field: "questions",
      message: "At least one question is required.",
    });
  }

  const questionIds = new Set<string>();

  for (const question of assessment.questions) {
    if (!isNonEmpty(question.id)) {
      issues.push({
        field: "questions.id",
        message: "Every question needs an ID.",
      });
    } else if (questionIds.has(question.id)) {
      issues.push({
        field: `questions.${question.id}`,
        message: "Question IDs must be unique.",
      });
    }

    questionIds.add(question.id);

    if (!isNonEmpty(question.skill)) {
      issues.push({
        field: `questions.${question.id}.skill`,
        message: "Question skill is required.",
      });
    }

    if (!isNonEmpty(question.prompt)) {
      issues.push({
        field: `questions.${question.id}.prompt`,
        message: "Question prompt is required.",
      });
    }

    if (
      !Number.isFinite(question.weight) ||
      question.weight <= 0
    ) {
      issues.push({
        field: `questions.${question.id}.weight`,
        message: "Question weight must be positive.",
      });
    }

    if (question.options.length < 2) {
      issues.push({
        field: `questions.${question.id}.options`,
        message: "At least two options are required.",
      });
    }

    const optionIds = new Set<string>();

    for (const option of question.options) {
      if (!isNonEmpty(option.id) || optionIds.has(option.id)) {
        issues.push({
          field: `questions.${question.id}.options`,
          message: "Option IDs must be present and unique.",
        });
      }

      if (!isNonEmpty(option.text)) {
        issues.push({
          field: `questions.${question.id}.options`,
          message: "Option text cannot be empty.",
        });
      }

      optionIds.add(option.id);
    }

    if (!optionIds.has(question.correctOptionId)) {
      issues.push({
        field: `questions.${question.id}.correctOptionId`,
        message: "Correct option must exist in the question.",
      });
    }

    if (
      !["beginner", "intermediate", "advanced"].includes(
        question.difficulty,
      )
    ) {
      issues.push({
        field: `questions.${question.id}.difficulty`,
        message: "Unsupported question difficulty.",
      });
    }
  }

  return issues;
}

export function validateAttempt(
  assessment: AssessmentDefinition,
  attempt: AssessmentAttempt,
): AssessmentIssue[] {
  const issues: AssessmentIssue[] = [];

  if (attempt.assessmentId !== assessment.id) {
    issues.push({
      field: "assessmentId",
      message: "Attempt does not belong to this assessment.",
    });
  }

  if (
    !Number.isFinite(attempt.durationSeconds) ||
    attempt.durationSeconds < 0
  ) {
    issues.push({
      field: "durationSeconds",
      message: "Attempt duration cannot be negative.",
    });
  }

  if (attempt.durationSeconds > assessment.durationSeconds) {
    issues.push({
      field: "durationSeconds",
      message: "Attempt exceeds the assessment time limit.",
    });
  }

  if (
    attempt.tabSwitches !== undefined &&
    (!Number.isInteger(attempt.tabSwitches) ||
      attempt.tabSwitches < 0)
  ) {
    issues.push({
      field: "tabSwitches",
      message: "Tab switch count must be a non-negative integer.",
    });
  }

  const knownQuestions = new Map(
    assessment.questions.map((question) => [question.id, question]),
  );

  const answeredQuestions = new Set<string>();

  for (const answer of attempt.answers) {
    const question = knownQuestions.get(answer.questionId);

    if (!question) {
      issues.push({
        field: `answers.${answer.questionId}`,
        message: "Answer references an unknown question.",
      });
      continue;
    }

    if (answeredQuestions.has(answer.questionId)) {
      issues.push({
        field: `answers.${answer.questionId}`,
        message: "Duplicate answer for a question.",
      });
    }

    answeredQuestions.add(answer.questionId);

    if (
      !question.options.some(
        (option) => option.id === answer.selectedOptionId,
      )
    ) {
      issues.push({
        field: `answers.${answer.questionId}`,
        message: "Selected option does not exist.",
      });
    }

    if (
      answer.responseTimeMs !== undefined &&
      (!Number.isFinite(answer.responseTimeMs) ||
        answer.responseTimeMs < 0)
    ) {
      issues.push({
        field: `answers.${answer.questionId}.responseTimeMs`,
        message: "Response time cannot be negative.",
      });
    }
  }

  return issues;
}

export function calculateSkillScores(
  assessment: AssessmentDefinition,
  answers: AssessmentAnswer[],
): SkillScore[] {
  const answerMap = new Map(
    answers.map((answer) => [answer.questionId, answer.selectedOptionId]),
  );

  const skillTotals = new Map<
    string,
    { earnedWeight: number; totalWeight: number }
  >();

  for (const question of assessment.questions) {
    const current = skillTotals.get(question.skill) ?? {
      earnedWeight: 0,
      totalWeight: 0,
    };

    current.totalWeight += question.weight;

    if (answerMap.get(question.id) === question.correctOptionId) {
      current.earnedWeight += question.weight;
    }

    skillTotals.set(question.skill, current);
  }

  return Array.from(skillTotals.entries())
    .map(([skill, totals]) => ({
      skill,
      earnedWeight: totals.earnedWeight,
      totalWeight: totals.totalWeight,
      score:
        totals.totalWeight > 0
          ? Math.round(
              (totals.earnedWeight / totals.totalWeight) * 100,
            )
          : 0,
    }))
    .sort((a, b) => b.score - a.score);
}

export function evaluateAssessment(
  assessment: AssessmentDefinition,
  attempt: AssessmentAttempt,
  policy: CertificationPolicy = {
    minimumScore: 70,
    maximumTabSwitches: 5,
    minimumDurationSeconds: 10,
  },
): AssessmentResult {
  const definitionIssues = validateAssessment(assessment);

  if (definitionIssues.length) {
    throw new Error(
      `Invalid assessment: ${definitionIssues
        .map((issue) => issue.message)
        .join(" ")}`,
    );
  }

  const attemptIssues = validateAttempt(assessment, attempt);

  if (attemptIssues.length) {
    throw new Error(
      `Invalid attempt: ${attemptIssues
        .map((issue) => issue.message)
        .join(" ")}`,
    );
  }

  const answerMap = new Map(
    attempt.answers.map((answer) => [
      answer.questionId,
      answer.selectedOptionId,
    ]),
  );

  let earnedWeight = 0;
  let totalWeight = 0;
  let correctAnswers = 0;

  for (const question of assessment.questions) {
    totalWeight += question.weight;

    if (answerMap.get(question.id) === question.correctOptionId) {
      earnedWeight += question.weight;
      correctAnswers += 1;
    }
  }

  const score =
    totalWeight > 0
      ? clamp(Math.round((earnedWeight / totalWeight) * 100), 0, 100)
      : 0;

  const reviewReasons: string[] = [];

  if (
    attempt.tabSwitches !== undefined &&
    attempt.tabSwitches > policy.maximumTabSwitches
  ) {
    reviewReasons.push("Tab-switch threshold exceeded.");
  }

  if (attempt.durationSeconds < policy.minimumDurationSeconds) {
    reviewReasons.push("Completion time requires manual review.");
  }

  const passed = score >= Math.max(
    assessment.passingScore,
    policy.minimumScore,
  );

  return {
    assessmentId: assessment.id,
    score,
    passed,
    correctAnswers,
    totalQuestions: assessment.questions.length,
    durationSeconds: attempt.durationSeconds,
    skillScores: calculateSkillScores(assessment, attempt.answers),
    reviewRequired: reviewReasons.length > 0,
    reviewReasons,
    completedAt: attempt.submittedAt ?? new Date().toISOString(),
  };
}

export function isCertificationEligible(
  result: AssessmentResult,
): boolean {
  return result.passed && !result.reviewRequired;
}

export function getAssessmentSummary(
  results: AssessmentResult[],
) {
  const total = results.length;
  const passed = results.filter((result) => result.passed).length;
  const reviewed = results.filter(
    (result) => result.reviewRequired,
  ).length;

  const averageScore =
    total > 0
      ? Math.round(
          results.reduce((sum, result) => sum + result.score, 0) /
            total,
        )
      : 0;

  return {
    totalAttempts: total,
    passedAttempts: passed,
    failedAttempts: total - passed,
    reviewRequired: reviewed,
    averageScore,
    passRate: total > 0 ? Math.round((passed / total) * 100) : 0,
  };
}
