import {
  calculateApplicationMatch,
  calculateApplicationConversion,
  canUpdateApplication,
  countApplicationsByStatus,
  filterOpportunities,
  publishOpportunity,
  validateOpportunity,
  type Opportunity,
  type OpportunityApplication,
} from "./opportunities";

const sample: Opportunity = {
  id: "job-1",
  companyId: "company-1",
  title: "AI Evaluation Specialist",
  description: "Evaluate AI responses for accuracy and reasoning quality.",
  type: "full_time",
  location: "Remote",
  remote: true,
  requiredSkills: ["AI Evaluation", "Python"],
  preferredSkills: ["Prompt Engineering"],
  minimumScore: 60,
  currency: "INR",
  openings: 2,
  status: "draft",
  createdAt: "2026-10-01T00:00:00.000Z",
  updatedAt: "2026-10-01T00:00:00.000Z",
};

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`Opportunity test failed: ${message}`);
}

export function runOpportunityTests(): void {
  assert(validateOpportunity(sample).valid, "sample opportunity is valid");

  const published = publishOpportunity(
    sample,
    new Date("2026-10-02T00:00:00.000Z"),
  );

  assert(published.status === "published", "publishing updates status");

  const match = calculateApplicationMatch(sample, {
    "AI Evaluation": 90,
    Python: 80,
    "Prompt Engineering": 70,
  });

  assert(match.eligible, "required skills should match");
  assert(match.score === 100, "full skill match should score 100");

  assert(
    filterOpportunities(
      [published],
      { remote: true },
      new Date("2026-10-03T00:00:00.000Z"),
    ).length === 1,
    "remote opportunity should be discoverable",
  );

  assert(
    canUpdateApplication("submitted", "under_review"),
    "submitted application can enter review",
  );

  assert(
    !canUpdateApplication("hired", "interview"),
    "hired application cannot return to interview",
  );

  const applications: OpportunityApplication[] = [
    {
      id: "application-1",
      opportunityId: "job-1",
      candidateId: "candidate-1",
      candidateName: "Test Candidate",
      skillScores: { Python: 80 },
      status: "hired",
      appliedAt: "2026-10-02T00:00:00.000Z",
      updatedAt: "2026-10-05T00:00:00.000Z",
    },
  ];

  assert(
    countApplicationsByStatus(applications).hired === 1,
    "hired applications are counted",
  );

  assert(
    calculateApplicationConversion(applications) === 100,
    "conversion should be 100 percent",
  );
}
