import assert from "node:assert/strict";
import { test } from "node:test";
import {
  calculateSkillScores,
  evaluateAssessment,
  getAssessmentSummary,
  isCertificationEligible,
  validateAssessment,
  validateAttempt,
  type AssessmentDefinition,
  type AssessmentAttempt,
} from "./assessment";

const assessment: AssessmentDefinition = {
  id: "ai-evaluation-basics",
  title: "AI Evaluation Fundamentals",
  durationSeconds: 600,
  passingScore: 70,
  questions: [
    {
      id: "q1",
      skill: "Accuracy",
      prompt: "Which response is factually supported?",
      options: [
        { id: "a", text: "Supported answer" },
        { id: "b", text: "Unsupported answer" },
      ],
      correctOptionId: "a",
      weight: 2,
      difficulty: "beginner",
    },
    {
      id: "q2",
      skill: "Accuracy",
      prompt: "Which response avoids invented facts?",
      options: [
        { id: "a", text: "Invent details" },
        { id: "b", text: "State uncertainty" },
      ],
      correctOptionId: "b",
      weight: 2,
      difficulty: "intermediate",
    },
    {
      id: "q3",
      skill: "Clarity",
      prompt: "Which response is easier to understand?",
      options: [
        { id: "a", text: "Clear explanation" },
        { id: "b", text: "Unstructured text" },
      ],
      correctOptionId: "a",
      weight: 1,
      difficulty: "beginner",
    },
  ],
};

const successfulAttempt: AssessmentAttempt = {
  assessmentId: "ai-evaluation-basics",
  answers: [
    { questionId: "q1", selectedOptionId: "a" },
    { questionId: "q2", selectedOptionId: "b" },
    { questionId: "q3", selectedOptionId: "a" },
  ],
  durationSeconds: 120,
  tabSwitches: 1,
  submittedAt: "2026-11-13T10:00:00.000Z",
};

test("accepts a valid assessment definition", () => {
  assert.deepEqual(validateAssessment(assessment), []);
});

test("rejects an invalid assessment definition", () => {
  const invalid = {
    ...assessment,
    passingScore: 120,
    questions: [],
  };

  assert.ok(validateAssessment(invalid).length > 0);
});

test("accepts a valid attempt", () => {
  assert.deepEqual(
    validateAttempt(assessment, successfulAttempt),
    [],
  );
});

test("rejects duplicate answers", () => {
  const attempt = {
    ...successfulAttempt,
    answers: [
      ...successfulAttempt.answers,
      { questionId: "q1", selectedOptionId: "a" },
    ],
  };

  assert.ok(validateAttempt(assessment, attempt).length > 0);
});

test("calculates weighted assessment score", () => {
  const result = evaluateAssessment(assessment, successfulAttempt);

  assert.equal(result.score, 100);
  assert.equal(result.correctAnswers, 3);
  assert.equal(result.passed, true);
});

test("calculates skill-level performance", () => {
  const scores = calculateSkillScores(
    assessment,
    successfulAttempt.answers,
  );

  assert.equal(scores.length, 2);
  assert.equal(scores[0].skill, "Accuracy");
  assert.equal(scores[0].score, 100);
});

test("flags suspicious tab switching for review", () => {
  const attempt = {
    ...successfulAttempt,
    tabSwitches: 9,
  };

  const result = evaluateAssessment(assessment, attempt);

  assert.equal(result.reviewRequired, true);
  assert.equal(isCertificationEligible(result), false);
});

test("does not certify a failed assessment", () => {
  const attempt = {
    ...successfulAttempt,
    answers: [
      { questionId: "q1", selectedOptionId: "b" },
      { questionId: "q2", selectedOptionId: "a" },
      { questionId: "q3", selectedOptionId: "b" },
    ],
  };

  const result = evaluateAssessment(assessment, attempt);

  assert.equal(result.passed, false);
  assert.equal(isCertificationEligible(result), false);
});

test("summarizes assessment history", () => {
  const passed = evaluateAssessment(assessment, successfulAttempt);
  const summary = getAssessmentSummary([passed]);

  assert.equal(summary.totalAttempts, 1);
  assert.equal(summary.passedAttempts, 1);
  assert.equal(summary.passRate, 100);
  assert.equal(summary.averageScore, 100);
});

test("rejects attempts exceeding the time limit", () => {
  const attempt = {
    ...successfulAttempt,
    durationSeconds: 900,
  };

  assert.ok(validateAttempt(assessment, attempt).length > 0);
});
