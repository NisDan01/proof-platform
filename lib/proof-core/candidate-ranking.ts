export interface CandidateSkillEvidence {
  name: string;
  score: number;
  verified: boolean;
}

export interface SkillRequirement {
  name: string;
  minimumScore: number;
  weight: number;
  mustBeVerified?: boolean;
}

export interface CandidateRankingInput {
  candidateId: string;
  skills: CandidateSkillEvidence[];
  requirements: SkillRequirement[];
  assessmentScore?: number;
}

export interface SkillMatchBreakdown {
  skill: string;
  candidateScore: number;
  requiredScore: number;
  contribution: number;
  verified: boolean;
  satisfied: boolean;
}

export interface CandidateRankingResult {
  candidateId: string;
  matchScore: number;
  eligible: boolean;
  matchedSkills: string[];
  missingSkills: string[];
  verifiedSkills: string[];
  breakdown: SkillMatchBreakdown[];
  reasons: string[];
}

const normalize = (value: string) => value.trim().toLowerCase();

const validScore = (value: number) =>
  Number.isFinite(value) && value >= 0 && value <= 100;

export function rankCandidate(
  input: CandidateRankingInput,
): CandidateRankingResult {
  if (!input.candidateId.trim()) {
    throw new Error("Candidate ID is required.");
  }

  if (input.requirements.length === 0) {
    throw new Error("At least one skill requirement is required.");
  }

  if (
    input.assessmentScore !== undefined &&
    !validScore(input.assessmentScore)
  ) {
    throw new Error("Assessment score must be between 0 and 100.");
  }

  const skillMap = new Map<string, CandidateSkillEvidence>();

  for (const skill of input.skills) {
    if (!skill.name.trim() || !validScore(skill.score)) {
      throw new Error("Candidate skill evidence is invalid.");
    }

    const key = normalize(skill.name);
    const existing = skillMap.get(key);

    if (
      !existing ||
      skill.score > existing.score ||
      (skill.score === existing.score && skill.verified)
    ) {
      skillMap.set(key, skill);
    }
  }

  const requirementNames = new Set<string>();
  let totalWeight = 0;
  let earnedWeight = 0;

  const breakdown: SkillMatchBreakdown[] = [];
  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];
  const verifiedSkills: string[] = [];
  const reasons: string[] = [];

  for (const requirement of input.requirements) {
    const key = normalize(requirement.name);

    if (!key || requirementNames.has(key)) {
      throw new Error("Skill requirements must have unique names.");
    }

    requirementNames.add(key);

    if (
      !validScore(requirement.minimumScore) ||
      !Number.isFinite(requirement.weight) ||
      requirement.weight <= 0
    ) {
      throw new Error("Skill requirement configuration is invalid.");
    }

    totalWeight += requirement.weight;

    const evidence = skillMap.get(key);
    const candidateScore = evidence?.score ?? 0;
    const verified = evidence?.verified ?? false;

    const scoreSatisfied =
      Boolean(evidence) &&
      candidateScore >= requirement.minimumScore;

    const verificationSatisfied =
      !requirement.mustBeVerified || verified;

    const satisfied = scoreSatisfied && verificationSatisfied;

    const normalizedScore = scoreSatisfied
      ? Math.min(candidateScore, 100)
      : candidateScore;

    const contribution =
      normalizedScore * requirement.weight *
      (requirement.mustBeVerified && !verified ? 0 : 1);

    earnedWeight += contribution;

    if (satisfied) {
      matchedSkills.push(requirement.name);
    } else {
      missingSkills.push(requirement.name);
      reasons.push(
        !evidence
          ? `Missing skill: ${requirement.name}`
          : !scoreSatisfied
            ? `${requirement.name} score is below the requirement`
            : `${requirement.name} requires verified evidence`,
      );
    }

    if (verified) verifiedSkills.push(requirement.name);

    breakdown.push({
      skill: requirement.name,
      candidateScore,
      requiredScore: requirement.minimumScore,
      contribution: Math.round(contribution * 100) / 100,
      verified,
      satisfied,
    });
  }

  const skillScore =
    totalWeight > 0 ? earnedWeight / totalWeight : 0;

  const matchScore =
    input.assessmentScore === undefined
      ? skillScore
      : skillScore * 0.85 + input.assessmentScore * 0.15;

  const eligible = missingSkills.length === 0;

  if (eligible) {
    reasons.push("Candidate satisfies all configured skill requirements.");
  }

  return {
    candidateId: input.candidateId,
    matchScore: Math.round(matchScore * 100) / 100,
    eligible,
    matchedSkills,
    missingSkills,
    verifiedSkills,
    breakdown,
    reasons,
  };
}
