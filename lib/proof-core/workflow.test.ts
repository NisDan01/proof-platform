import {
  averageCandidateScore,
  calculateSkillCoverage,
  canTransition,
  evaluateCandidate,
  hiringConversionRate,
  rankCandidates,
  summarizeHiringPipeline,
  transitionCandidate,
  validateHiringPolicy,
  type CandidateRecord,
  type HiringPolicy,
} from "./workflow";

const policy: HiringPolicy = {
  minimumScore: 70,
  requiredSkills: ["Python", "AI Evaluation"],
  allowedStages: ["applied", "screening", "challenge", "shortlisted"],
};

const candidate: CandidateRecord = {
  id: "candidate-1",
  name: "Sample Candidate",
  email: "candidate@example.com",
  skills: ["Python", "AI Evaluation"],
  score: 87,
  appliedAt: "2026-10-01T10:00:00.000Z",
  stage: "applied",
};

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`Workflow test failed: ${message}`);
}

export function runWorkflowTests(): void {
  assert(
    evaluateCandidate(candidate, policy).eligible,
    "qualified candidate should pass",
  );

  assert(
    calculateSkillCoverage(candidate, policy.requiredSkills) === 100,
    "complete skill coverage should be 100%",
  );

  assert(
    canTransition("applied", "screening"),
    "applied candidates can enter screening",
  );

  assert(
    !canTransition("hired", "interview"),
    "hired candidates cannot move backwards",
  );

  const result = transitionCandidate(
    candidate,
    "screening",
    "recruiter-1",
    "Initial review passed",
  );

  assert(result.candidate.stage === "screening", "stage should update");
  assert(result.event.from === "applied", "audit should retain old stage");

  const second: CandidateRecord = {
    ...candidate,
    id: "candidate-2",
    score: 75,
    stage: "screening",
  };

  const ranked = rankCandidates([second, candidate], policy);

  assert(ranked[0].id === candidate.id, "ranking should prioritize score");
  assert(averageCandidateScore([candidate, second]) === 81, "average score");
  assert(
    hiringConversionRate([candidate, second]) === 0,
    "empty hiring conversion",
  );

  const pipeline = summarizeHiringPipeline([candidate, second]);

  assert(pipeline.applied === 1, "pipeline applied count");
  assert(pipeline.screening === 1, "pipeline screening count");
  assert(validateHiringPolicy(policy).length === 0, "valid policy");
}

runWorkflowTests();
