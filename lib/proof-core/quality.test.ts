import test from "node:test";
import assert from "node:assert/strict";

import {
  qualityNormalizeText,
  qualityNormalizeSearchQuery,
  qualityValidateScore,
  qualityGetScoreBand,
  qualityCalculateWeightedScore,
  qualityBuildPagination,
  qualityEscapeCsvCell,
  qualityBuildCsv,
  qualitySummarizeIssues,
  qualityCompareScores,
  qualityCreateResult,
  qualityCreateRecordKey,
  qualityCalculatePassRate,
  qualityBuildScoreResult,
} from "./quality";

test("normalizes text safely", () => {
  assert.equal(qualityNormalizeText("  PROOF  "), "PROOF");
  assert.equal(qualityNormalizeText(null), "");
  assert.equal(qualityNormalizeText(123), "");
  assert.equal(qualityNormalizeText("abcdef", 3), "abc");
});

test("normalizes search queries", () => {
  assert.equal(qualityNormalizeSearchQuery("  AI   Evaluation  "), "AI Evaluation");
  assert.equal(qualityNormalizeSearchQuery(null), "");
});

test("validates valid scores", () => {
  assert.equal(qualityValidateScore(87).success, true);
  assert.equal(qualityValidateScore(0).success, true);
  assert.equal(qualityValidateScore(100).success, true);
});

test("rejects invalid scores", () => {
  assert.equal(qualityValidateScore(-1).success, false);
  assert.equal(qualityValidateScore(101).success, false);
  assert.equal(qualityValidateScore(NaN).success, false);
  assert.equal(qualityValidateScore("90").success, false);
});

test("classifies score bands", () => {
  assert.equal(qualityGetScoreBand(95), "Excellent");
  assert.equal(qualityGetScoreBand(85), "Strong");
  assert.equal(qualityGetScoreBand(75), "Developing");
  assert.equal(qualityGetScoreBand(60), "Needs improvement");
  assert.equal(qualityGetScoreBand(30), "Beginner");
});

test("rejects invalid score bands", () => {
  assert.throws(() => qualityGetScoreBand(101), RangeError);
});

test("calculates weighted scores", () => {
  assert.equal(
    qualityCalculateWeightedScore([
      { score: 80, weight: 1 },
      { score: 100, weight: 1 },
    ]),
    90,
  );
});

test("rejects invalid weighted score inputs", () => {
  assert.throws(() => qualityCalculateWeightedScore([]));
  assert.throws(() => qualityCalculateWeightedScore([
    { score: 120, weight: 1 },
  ]));
  assert.throws(() => qualityCalculateWeightedScore([
    { score: 80, weight: 0 },
  ]));
});

test("builds first page pagination", () => {
  const result = qualityBuildPagination(45, 1, 10);

  assert.equal(result.page, 1);
  assert.equal(result.totalPages, 5);
  assert.equal(result.offset, 0);
  assert.equal(result.hasPrevious, false);
  assert.equal(result.hasNext, true);
});

test("builds middle page pagination", () => {
  const result = qualityBuildPagination(45, 3, 10);

  assert.equal(result.page, 3);
  assert.equal(result.offset, 20);
  assert.equal(result.hasPrevious, true);
  assert.equal(result.hasNext, true);
});

test("clamps invalid pagination values", () => {
  const result = qualityBuildPagination(-10, -5, 1000);

  assert.equal(result.total, 0);
  assert.equal(result.page, 1);
  assert.equal(result.pageSize, 100);
  assert.equal(result.totalPages, 0);
});

test("escapes CSV formula injection", () => {
  assert.equal(qualityEscapeCsvCell("=SUM(A1:A2)"), "\"'=SUM(A1:A2)\"");
  assert.equal(qualityEscapeCsvCell("normal"), "\"normal\"");
});

test("escapes CSV quotation marks", () => {
  assert.equal(qualityEscapeCsvCell('hello "PROOF"'), '"hello ""PROOF"""');
});

test("builds safe CSV exports", () => {
  const csv = qualityBuildCsv(
    ["name", "score"],
    [["Candidate", 90], ["=FORMULA()", 80]],
  );

  assert.match(csv, /Candidate/);
  assert.match(csv, /'=FORMULA/);
});

test("summarizes issue severity", () => {
  const result = qualitySummarizeIssues([
    { field: "name", message: "Missing", severity: "high" },
    { field: "score", message: "Invalid", severity: "medium" },
    { field: "email", message: "Format", severity: "low" },
    { field: "role", message: "Missing", severity: "high" },
  ]);

  assert.deepEqual(result, { low: 1, medium: 1, high: 2 });
});

test("compares candidate scores", () => {
  assert.equal(qualityCompareScores(90, 75), 15);
  assert.equal(qualityCompareScores(70, 85), -15);
  assert.throws(() => qualityCompareScores(110, 50));
});

test("creates structured results", () => {
  assert.deepEqual(qualityCreateResult(42), {
    success: true,
    data: 42,
    issues: [],
  });

  const failed = qualityCreateResult(42, [{
    field: "score",
    message: "Invalid",
    severity: "high",
  }]);

  assert.equal(failed.success, false);
  assert.equal(failed.data, null);
});

test("creates stable record keys", () => {
  assert.equal(
    qualityCreateRecordKey("Candidate Profile", "User 123"),
    "candidate-profile:User-123",
  );

  assert.throws(() => qualityCreateRecordKey("", ""));
});

test("calculates pass rates", () => {
  assert.equal(qualityCalculatePassRate(8, 10), 80);
  assert.equal(qualityCalculatePassRate(0, 0), 0);
  assert.throws(() => qualityCalculatePassRate(11, 10));
});

test("builds candidate score results", () => {
  assert.deepEqual(qualityBuildScoreResult(87, 70), {
    score: 87,
    band: "Strong",
    passed: true,
  });

  assert.equal(qualityBuildScoreResult(55, 70).passed, false);
});
