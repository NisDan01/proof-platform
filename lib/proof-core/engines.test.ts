import test from "node:test";
import assert from "node:assert/strict";

import {
  rankCandidate,
  evaluateSkillEvidence,
  recommendOpportunities,
  analyzeHiringPipeline,
} from "./engines";

test("ranking recognizes a candidate who meets all requirements", () => {
  const result = rankCandidate({
    candidateId: "candidate-1",
    skills: [
      { name: "Python", score: 90, verified: true },
      { name: "SQL", score: 85, verified: true },
    ],
    requirements: [
      { name: "Python", minimumScore: 70, weight: 2 },
      { name: "SQL", minimumScore: 60, weight: 1 },
    ],
  });

  assert.equal(result.eligible, true);
  assert.equal(result.matchScore, 88.33);
  assert.equal(result.missingSkills.length, 0);
});

test("ranking rejects missing mandatory verified evidence", () => {
  const result = rankCandidate({
    candidateId: "candidate-2",
    skills: [
      { name: "Python", score: 95, verified: false },
    ],
    requirements: [
      {
        name: "Python",
        minimumScore: 70,
        weight: 1,
        mustBeVerified: true,
      },
    ],
  });

  assert.equal(result.eligible, false);
  assert.deepEqual(result.missingSkills, ["Python"]);
});

test("ranking rejects invalid candidate scores", () => {
  assert.throws(
    () =>
      rankCandidate({
        candidateId: "candidate-3",
        skills: [{ name: "Python", score: 150, verified: false }],
        requirements: [
          { name: "Python", minimumScore: 50, weight: 1 },
        ],
      }),
    /invalid/i,
  );
});

test("verification accepts trusted, current evidence", () => {
  const result = evaluateSkillEvidence(
    {
      candidateId: "candidate-4",
      skillName: "Python",
      score: 88,
      issuer: "PROOF Assessment",
      issuerTrusted: true,
      issuedAt: "2026-01-01T00:00:00.000Z",
      expiresAt: "2027-01-01T00:00:00.000Z",
    },
    { requireTrustedIssuer: true },
    new Date("2026-06-01T00:00:00.000Z"),
  );

  assert.equal(result.status, "verified");
  assert.equal(result.isVerified, true);
});

test("verification marks expired evidence correctly", () => {
  const result = evaluateSkillEvidence(
    {
      candidateId: "candidate-5",
      skillName: "SQL",
      score: 80,
      issuer: "PROOF",
      issuerTrusted: true,
      issuedAt: "2025-01-01T00:00:00.000Z",
      expiresAt: "2025-06-01T00:00:00.000Z",
    },
    { requireTrustedIssuer: true },
    new Date("2026-01-01T00:00:00.000Z"),
  );

  assert.equal(result.status, "expired");
});

test("recommendations rank open opportunities by match", () => {
  const results = recommendOpportunities(
    {
      candidateId: "candidate-6",
      skills: [
        { name: "Python", score: 90, verified: true },
      ],
    },
    [
      {
        id: "job-python",
        title: "Python Engineer",
        companyName: "Example Labs",
        status: "open",
        requiredSkills: [
          { name: "Python", minimumScore: 70, weight: 1 },
        ],
      },
      {
        id: "job-sql",
        title: "SQL Analyst",
        companyName: "Data Labs",
        status: "open",
        requiredSkills: [
          { name: "SQL", minimumScore: 70, weight: 1 },
        ],
      },
      {
        id: "job-closed",
        title: "Closed Role",
        companyName: "Example",
        status: "closed",
        requiredSkills: [
          { name: "Python", minimumScore: 70, weight: 1 },
        ],
      },
    ],
  );

  assert.equal(results.length, 2);
  assert.equal(results[0].opportunityId, "job-python");
  assert.equal(results[0].eligible, true);
});

test("pipeline analytics calculates stage counts and hire rate", () => {
  const report = analyzeHiringPipeline([
    {
      candidateId: "a",
      stage: "applied",
      occurredAt: "2026-01-01T00:00:00.000Z",
    },
    {
      candidateId: "a",
      stage: "interview",
      occurredAt: "2026-01-05T00:00:00.000Z",
    },
    {
      candidateId: "a",
      stage: "hired",
      occurredAt: "2026-01-11T00:00:00.000Z",
    },
    {
      candidateId: "b",
      stage: "applied",
      occurredAt: "2026-01-02T00:00:00.000Z",
    },
  ]);

  assert.equal(report.totalCandidates, 2);
  assert.equal(report.hiredCandidates, 1);
  assert.equal(report.overallHireRate, 50);
  assert.equal(report.averageDaysToHire, 10);
});

test("pipeline analytics reports invalid event timestamps", () => {
  const report = analyzeHiringPipeline([
    {
      candidateId: "candidate-x",
      stage: "applied",
      occurredAt: "not-a-date",
    },
  ]);

  assert.equal(report.totalCandidates, 0);
  assert.equal(report.dataQualityIssues.length, 1);
});
