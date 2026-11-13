import test from "node:test";
import assert from "node:assert/strict";

import {
  assessTrust,
  isDuplicateContent,
  shouldEscalateTrustReview,
} from "./trust";

test("trusted candidate receives low risk", () => {
  const result = assessTrust({
    entityId: "candidate-001",
    entityType: "candidate",
    accountAgeDays: 120,
    emailVerified: true,
    identityVerified: true,
    profileCompleteness: 95,
  });

  assert.equal(result.riskScore, 0);
  assert.equal(result.trustScore, 100);
  assert.equal(result.severity, "low");
  assert.equal(result.requiresReview, false);
});

test("unverified email adds risk", () => {
  const result = assessTrust({
    entityId: "candidate-002",
    entityType: "candidate",
    accountAgeDays: 60,
    emailVerified: false,
  });

  assert.equal(result.riskScore, 15);
  assert.ok(result.signals.some(
    (signal) => signal.code === "EMAIL_UNVERIFIED",
  ));
});

test("multiple reports increase risk", () => {
  const result = assessTrust({
    entityId: "company-001",
    entityType: "company",
    accountAgeDays: 100,
    emailVerified: true,
    reportedCount: 3,
  });

  assert.equal(result.riskScore, 30);
  assert.equal(result.severity, "moderate");
});

test("suspicious links trigger review signals", () => {
  const result = assessTrust({
    entityId: "company-002",
    entityType: "company",
    accountAgeDays: 30,
    emailVerified: true,
    suspiciousLinkCount: 3,
  });

  assert.equal(result.riskScore, 25);
  assert.ok(result.recommendations.some(
    (item) => item.includes("links"),
  ));
});

test("critical risk requires escalation", () => {
  const result = assessTrust({
    entityId: "company-003",
    entityType: "company",
    accountAgeDays: 1,
    emailVerified: false,
    reportedCount: 5,
    suspiciousLinkCount: 4,
    failedLoginCount: 12,
    unusualActivityCount: 5,
    domainVerified: false,
  });

  assert.equal(result.severity, "critical");
  assert.equal(result.requiresReview, true);
  assert.equal(shouldEscalateTrustReview(result), true);
});

test("duplicate content ignores case and whitespace", () => {
  assert.equal(
    isDuplicateContent("  PROOF Platform  ", "proof   platform"),
    true,
  );
});

test("different content is not considered duplicate", () => {
  assert.equal(
    isDuplicateContent("Python developer", "Data analyst"),
    false,
  );
});

test("invalid profile completeness is rejected", () => {
  assert.throws(
    () => assessTrust({
      entityId: "candidate-004",
      entityType: "candidate",
      accountAgeDays: 20,
      emailVerified: true,
      profileCompleteness: 120,
    }),
    /Profile completeness/,
  );
});

test("negative report counts are rejected", () => {
  assert.throws(
    () => assessTrust({
      entityId: "candidate-005",
      entityType: "candidate",
      accountAgeDays: 20,
      emailVerified: true,
      reportedCount: -1,
    }),
    /reportedCount/,
  );
});
